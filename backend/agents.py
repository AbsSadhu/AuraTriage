"""CrewAI Multi-Agent Swarm — India-specific Clinical Triage System.

Agents:
1. Chief Diagnostician (MBBS/MD) — Indian clinical guideline based
2. Clinical Pharmacologist — Jan Aushadhi aware, PMBJP cross-referencing
3. Financial Auditor — ₹ pricing, PMJAY/CGHS coverage, diagnostic lab routing
4. ABHA Compliance Officer — ABDM consent and data sharing validation
"""
import os
import json
import asyncio
from typing import Callable, Optional
from crewai import Agent, Task, Crew, Process, LLM
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ─── Multi-Model Swarm via OpenRouter ────────────────────────────────────────
# Each agent gets a different model optimized for its role.
# OpenRouter acts as a single API gateway — one key, many models.
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")

# 🩺 The Diagnostic God — DeepSeek-R1 (RL-based "thinking" model, best for complex clinical reasoning)
llm_diagnostician = LLM(
    model="openrouter/deepseek/deepseek-r1",
    api_key=OPENROUTER_KEY,
    temperature=0.0,
)

# 💊 The Context Monster — Gemini 2.0 Flash (1M token context, eats massive patient records)
llm_pharmacologist = LLM(
    model="openrouter/google/gemini-2.0-flash-001",
    api_key=OPENROUTER_KEY,
    temperature=0.0,
)

# ₹ The Reliable Workhorse — Llama 3.3 70B (elite instruction following, no hallucination)
llm_workhorse = LLM(
    model="openrouter/meta-llama/llama-3.3-70b-instruct",
    api_key=OPENROUTER_KEY,
    temperature=0.0,
)


def _build_agents():
    """Create the India-specific agent swarm with per-agent model assignments."""

    diagnostician = Agent(
        role="Chief Diagnostician (MBBS, MD Internal Medicine)",
        goal=(
            "Analyze patient symptoms, vitals, labs, and medical history to suggest the top 3 "
            "differential diagnoses with ICD-10 and SNOMED-CT codes, confidence scores, and "
            "detailed clinical reasoning following ICMR/NMC protocols for the Indian healthcare context."
        ),
        backstory=(
            "You are Dr. Aura Sharma, a senior physician with 25 years of experience across "
            "AIIMS Delhi, CMC Vellore, and multiple district hospitals. You have seen everything — "
            "from dengue outbreaks in Bihar to cardiac emergencies in Mumbai. You understand Indian "
            "patient demographics, tropical diseases prevalent in the subcontinent (dengue, typhoid, "
            "malaria, TB, chikungunya), and the socioeconomic factors that affect treatment adherence. "
            "You correlate symptoms (including Hinglish descriptions), labs, vitals, and history to form "
            "precise differentials. You ALWAYS cite evidence, assign confidence percentages, provide "
            "ICD-10 AND SNOMED-CT codes, and recommend immediate next steps including specific "
            "Indian-available investigations. Your reports are LONG, DETAILED, and CLINICAL-GRADE — "
            "they read like a senior consultant's discharge summary, not a chatbot response. "
            "You reference ICMR guidelines, National Treatment Guidelines for Antimicrobial Use in "
            "Infectious Diseases, and the NMC Gazette where relevant."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm_diagnostician,  # DeepSeek-R1 — the heavy thinker
    )

    pharmacologist = Agent(
        role="Clinical Pharmacologist & Jan Aushadhi Advisor",
        goal=(
            "Review diagnoses against patient medications/allergies for drug interactions and "
            "contraindications. Cross-reference ALL prescribed drugs against the Jan Aushadhi "
            "(PMBJP) generic database. Flag expensive branded drugs and suggest cheaper generic "
            "alternatives with exact ₹ savings."
        ),
        backstory=(
            "You are Dr. Pharma Reddy, a ruthless clinical pharmacologist from NIMHANS Bengaluru "
            "who HATES branded polypharmacy that drains Indian patients' pockets. You are intimately "
            "familiar with the Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) scheme and "
            "know that the same molecule available for ₹150 from Cipla or Sun Pharma can be bought "
            "for ₹10-₹20 from a Jan Aushadhi Kendra. You cross-reference every proposed treatment "
            "against the patient's active medications (checking Indian brand names like Dolo, Glycomet, "
            "Ecosprin, Telma, etc.) and allergies. You flag dangerous interactions with severity ratings. "
            "For EVERY branded drug prescribed, you MUST output a comparison table showing:\n"
            "• Branded Drug Name → Generic Equivalent\n"
            "• Brand Price (₹/strip) → Jan Aushadhi Price (₹/strip)\n"
            "• Savings per month (₹)\n"
            "• Available at nearest Jan Aushadhi Kendra (Yes/No)\n"
            "You understand Indian prescription abbreviations: OD, BD, TDS, QDS, SOS, HS, BBF, PC, AC."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm_pharmacologist,  # Gemini Flash — context monster for drug databases
    )

    financial_auditor = Agent(
        role="Financial Auditor & Diagnostic Routing Agent",
        goal=(
            "Evaluate treatment plans for cost-effectiveness in the Indian healthcare system. "
            "Check PMJAY/CGHS/ESIC coverage eligibility. Find the cheapest diagnostic labs "
            "near the patient's pincode. Produce cost comparisons in INR (₹)."
        ),
        backstory=(
            "You are Arjun the Auditor, a hospital administrator from Safdarjung Hospital Delhi "
            "who has seen families sell land to pay hospital bills. You are OBSESSED with cutting "
            "costs WITHOUT compromising care quality. You understand the Indian insurance landscape:\n"
            "• PMJAY (Ayushman Bharat) — ₹5 lakh/family/year for BPL families\n"
            "• CGHS — Central Government employees\n"
            "• ESIC — Factory/organized sector workers\n"
            "• Private Insurance — Star Health, ICICI Lombard, etc.\n"
            "• Self-Pay — Out-of-pocket patients\n\n"
            "For each recommended test/investigation, you query local diagnostic centers "
            "(Dr. Lal PathLabs, SRL, Thyrocare, Tata 1mg Labs, Metropolis) and present the "
            "TOP 3 CHEAPEST labs with:\n"
            "• Lab name, city, distance from patient's pincode\n"
            "• Price in ₹, turnaround time\n"
            "• Whether the patient's insurance covers it\n\n"
            "You produce DETAILED cost breakdowns and always suggest the most affordable care pathway."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm_workhorse,  # Llama 3.3 70B — reliable, no hallucination
    )

    abha_officer = Agent(
        role="ABHA Compliance Officer (ABDM)",
        goal=(
            "Validate that proper consent was obtained via ABHA before accessing patient records. "
            "Ensure all data sharing complies with Ayushman Bharat Digital Mission (ABDM) norms. "
            "Generate the compliance summary for the triage session."
        ),
        backstory=(
            "You are Kavita Verma, an ABDM compliance officer who ensures every data access "
            "in this hospital follows the Information Security and Privacy guidelines laid down by "
            "the National Health Authority (NHA). You verify that:\n"
            "• Patient's ABHA number is a valid 14-digit Health ID\n"
            "• Digital consent was obtained via Health Information Exchange & Consent Manager (HIE-CM)\n"
            "• Data sharing purpose is documented\n"
            "• Session access is time-bound and auditable\n"
            "• Longitudinal health records are only unlocked after consent PIN verification\n\n"
            "You generate a short compliance report for every triage session confirming ABDM adherence."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm_workhorse,  # Llama 3.3 70B — rigid compliance checking
    )

    return diagnostician, pharmacologist, financial_auditor, abha_officer


def build_crew(patient_context: str, symptoms_text: str):
    """Build the triage crew with contextual tasks."""

    diagnostician, pharmacologist, financial_auditor, abha_officer = _build_agents()

    diagnose_task = Task(
        description=(
            f"## CLINICAL TRIAGE ASSESSMENT\n\n"
            f"Review the following Indian patient record and chief complaint.\n\n"
            f"**Patient Record:**\n{patient_context}\n\n"
            f"**Chief Complaint / Symptoms (may include Hinglish):**\n{symptoms_text}\n\n"
            f"Provide a **DETAILED** clinical assessment with:\n"
            f"### For each of the top 3 differential diagnoses:\n"
            f"1. **Condition name** with ICD-10 AND SNOMED-CT codes\n"
            f"2. **Confidence percentage** (0-100%)\n"
            f"3. **Key supporting evidence** — cite specific vitals, labs, and symptoms\n"
            f"4. **Clinical reasoning** — why this diagnosis over others\n"
            f"5. **Recommended immediate actions** (specific Indian-available tests/interventions)\n"
            f"6. **Red flags** to watch for in the next 24-48 hours\n"
            f"7. **Referral recommendation** (if needed: Cardiologist, Nephrologist, etc.)\n\n"
            f"### Also include:\n"
            f"- **ICMR/NMC guideline references** where applicable\n"
            f"- **Tropical disease considerations** if symptoms suggest dengue/typhoid/malaria\n"
            f"- **Indian demographic risk factors** (diet, lifestyle, genetic predisposition)\n"
        ),
        expected_output=(
            "A comprehensive clinical assessment with 3 differential diagnoses, each containing "
            "ICD-10 and SNOMED-CT codes, confidence scores, evidence, clinical reasoning, "
            "recommended investigations, red flags, and referral advice. Minimum 500 words."
        ),
        agent=diagnostician,
    )

    review_task = Task(
        description=(
            f"## PHARMACOLOGICAL SAFETY REVIEW + JAN AUSHADHI COMPARISON\n\n"
            f"Review the diagnostician's proposed conditions and treatment actions.\n\n"
            f"**Patient Record:**\n{patient_context}\n\n"
            f"### Safety Review:\n"
            f"Cross-reference against:\n"
            f"- Current active medications (check Indian brand names — Dolo, Glycomet, Ecosprin, etc.)\n"
            f"- Known allergies (flag contraindications)\n"
            f"- Lab results (dose adjustments needed for renal/hepatic impairment?)\n\n"
            f"For each proposed treatment:\n"
            f"1. **SAFE / WARNING / DANGER** rating with explanation\n"
            f"2. Specific drug-drug and drug-disease interactions\n"
            f"3. Recommended alternatives if unsafe\n\n"
            f"### Jan Aushadhi Cost Comparison (MANDATORY):\n"
            f"For EVERY branded drug in the current medication list AND any new prescriptions:\n\n"
            f"| Branded Drug | Generic Name | Brand ₹/strip | Jan Aushadhi ₹/strip | Monthly Savings ₹ | PMBJP Available |\n"
            f"|---|---|---|---|---|---|\n"
            f"| (fill for each drug) |\n\n"
            f"Flag any drug where the branded version costs 3x+ the generic equivalent.\n"
            f"Calculate TOTAL monthly savings if all drugs switched to Jan Aushadhi generics.\n"
        ),
        expected_output=(
            "A detailed pharmacological safety review with interaction checks AND a complete "
            "Jan Aushadhi cost comparison table showing ₹ savings for every drug."
        ),
        agent=pharmacologist,
    )

    audit_task = Task(
        description=(
            f"## FINANCIAL ANALYSIS & DIAGNOSTIC ROUTING (Indian Healthcare)\n\n"
            f"**Patient Insurance Tier:** Check the patient record for PMJAY/CGHS/ESIC/Private/Self-Pay.\n\n"
            f"### Cost Analysis:\n"
            f"1. Estimated treatment cost range in ₹ (INR)\n"
            f"2. Insurance coverage assessment:\n"
            f"   - If PMJAY: Is the condition covered under AB-PMJAY package list? What's the package rate?\n"
            f"   - If CGHS: CGHS rate applicable? Which empanelled hospital?\n"
            f"   - If Self-Pay: Detailed out-of-pocket estimate\n"
            f"3. Government scheme eligibility (Janani Suraksha Yojana, Rashtriya Bal Swasthya Karyakram, etc.)\n\n"
            f"### Diagnostic Lab Routing:\n"
            f"For EVERY recommended investigation/test, present TOP 3 cheapest labs:\n\n"
            f"| Test Name | Lab Name | City | Price ₹ | Turnaround | Distance |\n"
            f"|---|---|---|---|---|---|\n"
            f"| (fill for each test) |\n\n"
            f"### Final Recommendation:\n"
            f"- Most cost-effective care pathway\n"
            f"- Total estimated cost for complete treatment cycle (₹)\n"
            f"- Recommended hospital tier (PHC → CHC → District Hospital → Tertiary)\n"
        ),
        expected_output=(
            "A comprehensive financial analysis with ₹ costs, insurance coverage, diagnostic lab "
            "routing table, and a recommended cost-optimized treatment pathway for the Indian patient."
        ),
        agent=financial_auditor,
    )

    crew = Crew(
        agents=[diagnostician, pharmacologist, financial_auditor],
        tasks=[diagnose_task, review_task, audit_task],
        process=Process.sequential,
        verbose=True,
    )

    return crew


async def run_crew_streaming(
    patient_context: str,
    symptoms_text: str,
    on_agent_output: Optional[Callable] = None,
):
    """
    Run the crew and stream output per agent via the callback.
    Cascades context from one agent to the next to prevent hallucination.
    """
    diagnostician, pharmacologist, financial_auditor, abha_officer = _build_agents()
    agents_info = [
        {"role": "Chief Diagnostician", "avatar": "🩺", "agent": diagnostician},
        {"role": "Jan Aushadhi Pharmacologist", "avatar": "💊", "agent": pharmacologist},
        {"role": "Financial Auditor & Lab Router", "avatar": "₹", "agent": financial_auditor},
        {"role": "ABHA Compliance Officer", "avatar": "🛡️", "agent": abha_officer},
    ]

    results = []
    accumulated_context = ""

    for i, agent_info in enumerate(agents_info):
        if on_agent_output:
            await on_agent_output({
                "type": "agent_thinking",
                "agent": agent_info["role"],
                "avatar": agent_info["avatar"],
                "index": i,
            })

        # Dynamically build the task description so it always includes previous agents' outputs
        if i == 0:
            task_desc = (
                f"## CLINICAL TRIAGE — DETAILED ASSESSMENT\n\n"
                f"**Patient Record:**\n{patient_context}\n\n"
                f"**Chief Complaint / Symptoms (Hinglish):**\n{symptoms_text}\n\n"
                f"Provide top 3 differential diagnoses with ICD-10 + SNOMED-CT codes, "
                f"confidence %, evidence, clinical reasoning, recommended Indian-available "
                f"tests, red flags, and referral advice. Reference ICMR/NMC protocols. "
                f"Consider tropical diseases (dengue, typhoid, malaria, TB). "
                f"Output must be LONG, DETAILED, and CLINICAL-GRADE (minimum 500 words)."
            )
            expected_out = "Comprehensive 3-diagnosis clinical assessment."
        elif i == 1:
            task_desc = (
                f"## PHARMACOLOGICAL REVIEW + JAN AUSHADHI COMPARISON\n\n"
                f"**Patient Record:**\n{patient_context}\n\n"
                f"**DIAGNOSTICIAN'S PLAN TO REVIEW:**\n{accumulated_context}\n\n"
                f"1. Rate each current and proposed treatment: SAFE / WARNING / DANGER\n"
                f"2. Flag drug-drug and drug-disease interactions\n"
                f"3. For EVERY branded drug, create a Jan Aushadhi comparison table:\n"
                f"   Brand Name → Generic → Brand ₹ → Jan Aushadhi ₹ → Monthly Savings ₹\n"
                f"4. Calculate TOTAL monthly savings with PMBJP switch\n"
                f"5. Flag medications where branded costs 3x+ the generic"
            )
            expected_out = "Safety review with Jan Aushadhi ₹ savings table for every drug proposed."
        elif i == 2:
            task_desc = (
                f"## FINANCIAL ANALYSIS + DIAGNOSTIC LAB ROUTING\n\n"
                f"**Patient Record:**\n{patient_context}\n\n"
                f"**PROPOSED TREATMENT PLAN TO AUDIT:**\n{accumulated_context}\n\n"
                f"1. Total treatment cost estimate in ₹\n"
                f"2. Insurance coverage: PMJAY (₹5L) / CGHS / ESIC / Private / Self-Pay\n"
                f"3. For every recommended test, find top 3 cheapest labs:\n"
                f"   Test → Lab Name → Price ₹ → Turnaround → Distance from patient\n"
                f"4. Government scheme eligibility check\n"
                f"5. Recommended hospital tier and total cost pathway in ₹"
            )
            expected_out = "Financial analysis with ₹ costs, insurance check, and diagnostic lab routing table."
        else:
            task_desc = (
                f"## ABDM COMPLIANCE CHECK\n\n"
                f"**Patient Record:**\n{patient_context}\n\n"
                f"Verify:\n"
                f"1. ABHA number format is valid 14-digit Health ID\n"
                f"2. Digital consent was obtained via HIE-CM\n"
                f"3. Data sharing purpose is documented\n"
                f"4. Session access is time-bound\n"
                f"5. Generate compliance summary for this triage session"
            )
            expected_out = "ABDM compliance report confirming data access legitimacy."

        task = Task(
            description=task_desc,
            expected_output=expected_out,
            agent=agent_info["agent"],
        )

        crew = Crew(
            agents=[agent_info["agent"]],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, crew.kickoff)

        output_text = str(result)
        
        # We removed the hard INVALID_QUERY abort because the 8B model was constantly tripping it by accident on valid medical text.
        # Now it will just respond normally to the medical query.
            
        results.append(output_text)
        # Cascade the context so the next agent knows what the previous agent said
        accumulated_context += f"\n\n--- Output from {agent_info['role']} ---\n{output_text}"

        if on_agent_output:
            await on_agent_output({
                "type": "agent_result",
                "agent": agent_info["role"],
                "avatar": agent_info["avatar"],
                "index": i,
                "content": output_text,
                "confidence": _extract_confidence(output_text),
            })
            
        # Brief pause between agents for OpenRouter
        await asyncio.sleep(1.0)

    # --- Final Executive Summary ---
    await asyncio.sleep(1.0)
    
    if on_agent_output:
        await on_agent_output({
            "type": "agent_thinking",
            "agent": "Chief Medical Officer (Summarizer)",
            "avatar": "📋",
            "index": 4,
        })
        
    summary_task_desc = (
        f"You are the Chief Medical Officer presenting the final clinical report to the attending doctor.\n"
        f"Here is the COMPLETE deliberation from the 4-agent Triage Swarm:\n{accumulated_context}\n\n"
        f"Generate a COMPREHENSIVE executive summary covering ALL of the following sections.\n"
        f"Use bold markdown headers for each section. Be specific — use exact drug names, ICD-10 codes, \u20b9 amounts, and lab names.\n\n"
        f"## 🏥 FINAL DIAGNOSIS\n"
        f"- Primary diagnosis with ICD-10 code and confidence %\n"
        f"- Secondary differentials to rule out\n\n"
        f"## 💊 MEDICATION PLAN\n"
        f"- Prescribed medications with dosage and frequency (OD/BD/TDS)\n"
        f"- Jan Aushadhi generic alternatives with \u20b9 savings per month\n"
        f"- Drug interaction warnings (if any)\n\n"
        f"## \u20b9 COST BREAKDOWN\n"
        f"- Total estimated treatment cost in \u20b9\n"
        f"- Insurance coverage (PMJAY/CGHS/ESIC eligibility)\n"
        f"- Cheapest diagnostic labs recommended\n\n"
        f"## \u26a0\ufe0f RED FLAGS\n"
        f"- Critical symptoms to watch in the next 24-48 hours\n"
        f"- When to escalate to emergency\n\n"
        f"## \u27a1\ufe0f NEXT STEPS\n"
        f"- Immediate actions (labs, referrals, follow-up timeline)\n"
        f"- Recommended hospital tier (PHC \u2192 CHC \u2192 District \u2192 Tertiary)\n\n"
        f"Keep it under 400 words. This is the ONLY thing the doctor will read \u2014 make every word count."
    )
    
    # Use the pharmacologist's LLM (Gemini Flash) for speed — DeepSeek-R1 is too slow for summaries
    summary_agent = Agent(
        role="Chief Medical Officer",
        goal="Summarize the swarm deliberation into a clear clinical report for the doctor.",
        backstory="Senior CMO who distills complex multi-specialist debates into actionable clinical summaries.",
        verbose=False,
        allow_delegation=False,
        llm=llm_pharmacologist,  # Gemini Flash for speed
    )
    
    summary_task = Task(
        description=summary_task_desc,
        expected_output="A comprehensive clinical summary with diagnosis, medications, costs, red flags, and next steps.",
        agent=summary_agent
    )
    
    summary_crew = Crew(
        agents=[summary_agent],
        tasks=[summary_task],
        process=Process.sequential,
        verbose=False
    )
    
    loop = asyncio.get_event_loop()
    summary_result = await loop.run_in_executor(None, summary_crew.kickoff)
    final_summary_text = str(summary_result)

    if on_agent_output:
        await on_agent_output({
            "type": "triage_complete",
            "summary": final_summary_text,
            "agent_count": len(agents_info),
        })

    return results


def _extract_confidence(text: str) -> int:
    """Try to extract a confidence percentage from agent output."""
    import re
    matches = re.findall(r"(\d{1,3})%", text)
    if matches:
        return max(int(m) for m in matches if int(m) <= 100)
    return 75

import os
from crewai import Agent, Task, Crew, Process, LLM

llm = LLM(
    model="openrouter/deepseek/deepseek-r1",
    api_key=os.environ.get("OPENROUTER_API_KEY")
)

gatekeeper = Agent(
    role="Clinical Triage Nurse",
    goal="Reject any input that is not a medical query and refuse to pass it to the Diagnostician.",
    backstory="A strict triage nurse guarding the clinical workflow.",
    allow_delegation=False,
    llm=llm
)

diagnostician = Agent(
    role="Chief Diagnostician",
    goal="Review medical queries and output a diagnostic plan.",
    backstory="An expert physician in clinical diagnosis.",
    allow_delegation=False,
    llm=llm
)

auditor = Agent(
    role="Jan Aushadhi Auditor",
    goal="Cross-reference the Diagnostician's output and replace expensive branded drugs with cheap Indian Jan Aushadhi generic alternatives.",
    backstory="An auditor specializing in PMBJP cost-saving protocols.",
    allow_delegation=False,
    llm=llm
)

gatekeeper_task = Task(
    description="Evaluate the query and reject it if it is not medical. If it is medical, summarize it for the Diagnostician.",
    expected_output="A summarized medical query or a strict rejection.",
    agent=gatekeeper
)

diagnose_task = Task(
    description="Analyze the summarized medical query and provide a treatment plan including medications.",
    expected_output="A clinical treatment plan.",
    agent=diagnostician
)

audit_task = Task(
    description="Review the treatment plan and replace all branded drugs with Jan Aushadhi generic alternatives.",
    expected_output="A finalized treatment plan highlighting generic alternatives.",
    agent=auditor
)

medical_crew = Crew(
    agents=[gatekeeper, diagnostician, auditor],
    tasks=[gatekeeper_task, diagnose_task, audit_task],
    process=Process.sequential
)

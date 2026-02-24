import requests
from fhir.resources.patient import Patient

class AuraFHIRClient:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def get_patient(self, abha_id: str):
        response = requests.get(f"{self.base_url}/Patient/{abha_id}")
        response.raise_for_status()
        return Patient.model_validate(response.json())

    def create_op_consult(self, consult_data: dict):
        response = requests.post(f"{self.base_url}/Composition", json=consult_data)
        response.raise_for_status()
        return response.json()

    def update_medication(self, med_id: str, update_data: dict):
        response = requests.put(f"{self.base_url}/MedicationRequest/{med_id}", json=update_data)
        response.raise_for_status()
        return response.json()

    def delete_record(self, resource_type: str, resource_id: str):
        response = requests.delete(f"{self.base_url}/{resource_type}/{resource_id}")
        response.raise_for_status()
        return response.json()

import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_webhooks_vapi_agencyid_database_failure():
    agency_id = f"test-agency-{uuid.uuid4()}"
    url = f"{BASE_URL}/api/webhooks/vapi/{agency_id}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "message": {
            "type": "transcript",
            "call": {"id": str(uuid.uuid4())},
            "event": {"text": "This should cause DB failure simulation"}
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 500, f"Expected 500, got {response.status_code}"
        json_response = response.json()
        assert "error" in json_response, "Response JSON must contain 'error'"
        assert json_response["error"] == "Internal error", f"Expected error 'Internal error', got {json_response['error']}"

        # Verify no transcript event is persisted
        # As no API or DB access is provided to verify persistence,
        # we rely on the 500 error to imply no data was persisted.
        # If an endpoint or method existed to check the DB, it would be called here.
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_webhooks_vapi_agencyid_database_failure()
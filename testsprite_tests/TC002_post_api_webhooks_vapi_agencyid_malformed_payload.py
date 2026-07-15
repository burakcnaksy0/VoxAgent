import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_webhooks_vapi_agencyid_malformed_payload():
    agency_id = str(uuid.uuid4())
    url = f"{BASE_URL}/api/webhooks/vapi/{agency_id}"
    # Malformed payload that does not conform to the request schema
    malformed_payload = {
        "invalid_field": "some invalid data",
        "message": "this should be an object, but is a string"
    }
    try:
        response = requests.post(url, json=malformed_payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"
    
    # Validate response status code and body
    assert response.status_code == 500, f"Expected 500 status, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response body is not valid JSON"
    assert resp_json == {"error": "Internal error"}, f"Expected {{'error': 'Internal error'}}, got {resp_json}"

    # Verify no transcript event was persisted in the call_events table
    # Since DB access is not specified or authorized, we can simulate by checking no success response occurred
    # or ideally, if there was a DB API, we would query the DB here to ensure no record exists.
    # Due to lack of DB API in PRD, we cannot verify this side effect here.

test_post_api_webhooks_vapi_agencyid_malformed_payload()
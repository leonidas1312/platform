import json
import subprocess
import sys
import os
import tempfile

def handler(event, context):
    try:
        # Parse the JSON payload from the POST request
        body = json.loads(event.get("body", "{}"))
        code = body.get("code", "")
        if not code:
            return {
                "statusCode": 400,
                "body": json.dumps({"output": "No code provided"})
            }
    except Exception as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"output": f"Error parsing request body: {str(e)}"})
        }
    
    # Write the code to a temporary file
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as temp_file:
            temp_file.write(code)
            temp_filename = temp_file.name
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"output": f"Error writing temporary file: {str(e)}"})
        }
    
    # Execute the temporary Python file using the current Python interpreter
    try:
        result = subprocess.run(
            [sys.executable, temp_filename],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30,  # seconds
            text=True
        )
        output = result.stdout + "\n" + result.stderr
    except Exception as e:
        output = f"Error executing code: {str(e)}"
    finally:
        os.unlink(temp_filename)  # Clean up the temporary file

    return {
        "statusCode": 200,
        "body": json.dumps({"output": output})
    }

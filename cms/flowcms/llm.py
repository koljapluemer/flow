import json

from dotenv import load_dotenv
from openai import OpenAI

from flowcms.repo import ROOT

MODEL = "gpt-4.1-mini"

load_dotenv(ROOT / ".env")


def json_completion(prompt: str, schema_name: str, schema: dict) -> dict:
    """Sends a single prompt and returns the reply parsed against the given JSON schema (structured outputs)."""
    response = OpenAI().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_schema", "json_schema": {"name": schema_name, "strict": True, "schema": schema}},
    )
    return json.loads(response.choices[0].message.content)

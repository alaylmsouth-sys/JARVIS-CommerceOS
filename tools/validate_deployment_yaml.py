from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]


def load_yaml(relative_path: str) -> dict:
    path = ROOT / relative_path
    with path.open(encoding="utf-8") as stream:
        value = yaml.safe_load(stream)
    if not isinstance(value, dict):
        raise ValueError(f"{relative_path} must contain a YAML mapping")
    return value


def main() -> None:
    compose_dev = load_yaml("docker-compose.yml")
    compose_prod = load_yaml("docker-compose.prod.yml")
    render = load_yaml("render.yaml")
    workflow = load_yaml(".github/workflows/ci.yml")

    assert "migrate" in compose_dev["services"]
    assert "migrate" in compose_prod["services"]
    assert compose_prod["services"]["backend"]["depends_on"]["migrate"][
        "condition"
    ] == "service_completed_successfully"
    assert compose_prod["services"]["backend"].get("ports") is None
    assert compose_prod["services"]["frontend"].get("ports") is None

    api = render["services"][0]
    assert api["healthCheckPath"] == "/health/ready"
    assert "alembic upgrade head" in api["dockerCommand"]
    assert api["autoDeployTrigger"] == "checksPass"

    assert "deployment-config" in workflow["jobs"]
    deploy = workflow["jobs"]["deploy"]
    assert deploy["needs"] == [
        "backend",
        "frontend",
        "docker",
        "deployment-config",
    ]
    assert "refs/heads/main" in deploy["if"]
    assert set(deploy["env"]) == {
        "RENDER_DEPLOY_HOOK_API",
        "RENDER_DEPLOY_HOOK_WEB",
    }
    assert len(deploy["steps"]) == 3
    assert all("secrets." not in step.get("if", "") for step in deploy["steps"])

    print("Deployment YAML validation passed.")


if __name__ == "__main__":
    main()

from hashlib import sha256
from app.modules.sourcing.coupang import search_coupang
from app.modules.sourcing.schemas import CandidateCreate
from app.modules.sourcing.scoring import calculate_score

CATALOG = {
    "선풍기": [
        ("휴대용 미니 선풍기", 8500, 21900, 2800, 44, 78, 66),
        ("접이식 탁상용 선풍기", 12500, 32900, 3200, 52, 74, 72),
        ("넥밴드 선풍기", 16800, 39900, 3500, 61, 69, 70),
        ("캠핑용 충전식 선풍기", 22000, 54900, 4500, 48, 82, 77),
    ],
    "텀블러": [
        ("진공 보온 텀블러", 9000, 24900, 3000, 58, 64, 75),
        ("대용량 손잡이 텀블러", 13500, 32900, 3500, 51, 72, 81),
        ("차량용 슬림 텀블러", 11000, 28900, 3000, 45, 67, 70),
    ],
    "블렌더": [
        ("휴대용 미니 블렌더", 14500, 39900, 3500, 55, 76, 82),
        ("무선 쉐이크 블렌더", 17800, 46900, 3800, 49, 73, 80),
        ("USB 충전 믹서컵", 9800, 28900, 3000, 42, 69, 68),
    ],
}

SUFFIXES = ["프리미엄", "휴대용", "대용량", "슬림형", "무선형"]

def stable(keyword: str, index: int, low: int, high: int) -> int:
    value = int(sha256(f"{keyword}:{index}".encode()).hexdigest()[:8], 16)
    return low + value % (high - low + 1)

def score_results(payloads: list[CandidateCreate]) -> list[dict]:
    results = []
    for payload in payloads:
        score = calculate_score(payload)
        results.append({**payload.model_dump(), **score.__dict__})
    return sorted(results, key=lambda x: x["total_score"], reverse=True)

def catalog_candidates(keyword: str, marketplace: str, country: str) -> list[CandidateCreate]:
    normalized = keyword.strip().lower()
    rows = next((items for key, items in CATALOG.items() if key in normalized), None)
    if rows is None:
        rows = []
        for i, suffix in enumerate(SUFFIXES):
            source = stable(normalized, i, 7000, 22000)
            target = int(source * stable(normalized, i + 10, 180, 260) / 100)
            rows.append((
                f"{suffix} {keyword}", source, target,
                stable(normalized, i + 20, 2500, 4500),
                stable(normalized, i + 30, 35, 75),
                stable(normalized, i + 40, 45, 85),
                stable(normalized, i + 50, 45, 85),
            ))

    return [
        CandidateCreate(
            name=name, marketplace=marketplace, country=country,
            source_price=source, target_price=target, shipping_cost=shipping,
            platform_fee_rate=12, ad_cost_rate=5,
            competition_score=competition, trend_score=trend, brand_score=brand,
        )
        for name, source, target, shipping, competition, trend, brand in rows
    ]

def search_candidates(keyword: str, marketplace: str, country: str) -> list[dict]:
    if marketplace == "coupang" and country.upper() == "KR":
        try:
            adapter_results = search_coupang(keyword)
        except Exception:
            adapter_results = []
        if adapter_results:
            return score_results(adapter_results)
    return score_results(catalog_candidates(keyword, marketplace, country))

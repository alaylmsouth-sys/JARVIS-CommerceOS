from dataclasses import dataclass
from app.modules.sourcing.schemas import CandidateCreate
def clamp(v): return max(0,min(100,v))
@dataclass(frozen=True)
class ScoreResult: total_cost:float;gross_profit:float;margin_rate:float;total_score:float;recommendation:str;explanation:str
def calculate_score(p:CandidateCreate):
    total=p.source_price+p.shipping_cost+p.target_price*(p.platform_fee_rate+p.ad_cost_rate)/100
    profit=p.target_price-total
    margin=profit/p.target_price*100
    score=clamp(clamp(margin*2.2)*.35+(100-p.competition_score)*.20+p.trend_score*.25+p.brand_score*.20)
    rec='비추천' if profit<=0 or margin<10 else '강력 추천' if score>=80 else '추천' if score>=65 else '검토' if score>=50 else '보류'
    exp=f'예상 순마진율 {margin:.1f}%, 종합점수 {score:.1f}점입니다. 경쟁도 {p.competition_score:.0f}, 트렌드 {p.trend_score:.0f}, 브랜드성 {p.brand_score:.0f}을 반영해 {rec}으로 판정했습니다.'
    return ScoreResult(round(total,2),round(profit,2),round(margin,2),round(score,2),rec,exp)

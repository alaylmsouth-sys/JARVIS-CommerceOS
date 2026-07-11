from dataclasses import dataclass
from app.schemas import CandidateCreate
def clamp(v):return max(0,min(100,v))
@dataclass(frozen=True)
class Result:total_cost:float;gross_profit:float;margin_rate:float;total_score:float;recommendation:str;explanation:str
def calculate(p:CandidateCreate)->Result:
 fee=p.target_price*p.platform_fee_rate/100; ad=p.target_price*p.ad_cost_rate/100; cost=p.source_price+p.shipping_cost+fee+ad
 profit=p.target_price-cost; margin=profit/p.target_price*100; score=clamp(clamp(margin*2.2)*.35+(100-p.competition_score)*.2+p.trend_score*.25+p.brand_score*.2)
 rec='비추천' if profit<=0 or margin<10 else '강력 추천' if score>=80 else '추천' if score>=65 else '검토' if score>=50 else '보류'
 parts=[f'예상 순마진율은 {margin:.1f}%입니다.']
 if p.competition_score<=35:parts.append('경쟁 강도가 낮아 진입 여지가 있습니다.')
 if p.competition_score>=70:parts.append('경쟁 강도가 높아 차별화가 필요합니다.')
 if p.trend_score>=70:parts.append('트렌드 신호가 강합니다.')
 if p.brand_score>=70:parts.append('브랜드 확장 후보입니다.')
 parts.append(f'종합 {score:.1f}점, 판정은 {rec}입니다.')
 return Result(round(cost,2),round(profit,2),round(margin,2),round(score,2),rec,' '.join(parts))

// 백엔드 실연동 전역 토글.
// - 기본값 true: VITE_USE_MOCK을 안 정하면 지금까지처럼 전부 mock으로 동작한다(안전).
// - `VITE_USE_MOCK=false`로 켜면, 실API로 "변환된 함수"만 실제 백엔드를 호출한다.
//   아직 변환하지 않은 함수는 이 플래그를 보지 않고 항상 mock을 반환하므로,
//   도메인을 하나씩 옮기는 동안(부분 컷오버) 앱이 깨지지 않는다.
// 멘탈 모델: "실서버가 준비된 곳은 실서버를 쓴다."
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

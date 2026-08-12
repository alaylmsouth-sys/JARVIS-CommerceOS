@echo off
REM JARVIS CommerceOS 간편 실행기
cd /d "%~dp0"

docker compose version >nul 2>nul
if errorlevel 1 goto :docker_missing

if not exist .env (
  copy .env.example .env >nul
  echo [안내] .env 파일을 만들었습니다. 기본 로그인 정보는 README의 빠른 시작에서 확인할 수 있습니다.
)

echo JARVIS CommerceOS를 시작합니다.
echo 브라우저에서 http://127.0.0.1:3000 을 여세요. 종료하려면 Ctrl+C를 누르세요.
start "" http://127.0.0.1:3000
docker compose up --build
goto :eof

:docker_missing
echo Docker Desktop이 실행 중인지 확인하세요.
pause
exit /b 1

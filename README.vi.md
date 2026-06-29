# Sime

Sime là nền tảng luyện thanh bằng AI dành cho cách học có cấu trúc như trong trường đại học. Ứng dụng có dashboard đơn giản cho học viên, giáo trình bài học, phản hồi cao độ trực tiếp, đo quãng giọng, phân loại giọng, huấn luyện viên AI và worker phân tích âm thanh.

## Thành phần trong repo

- `landing/`: trang giới thiệu tĩnh.
- `frontend/`: ứng dụng sản phẩm bằng Next.js App Router.
- `backend/`: API Express + TypeScript cho xác thực, bài học, tiến độ, hồ sơ giọng, job phân tích và callback từ worker.
- `worker/`: Python Redis worker và FastAPI acoustic analysis API.
- `docker-compose.yml`: triển khai local bằng một lệnh, gồm PostgreSQL + pgvector, Redis, backend, frontend, worker và worker API.
- `.github/workflows/ci.yml`: GitHub Actions CI/CD cho build, test, kiểm tra Docker và publish image lên GHCR.

## Chạy nhanh bằng Docker Compose

Yêu cầu:

- Docker Desktop hoặc Docker Engine có Docker Compose.
- Tùy chọn: OpenAI hoặc Gemini API key nếu muốn dùng phản hồi huấn luyện AI.

```bash
cp .env.example .env
# Sửa JWT_SECRET và WORKER_SHARED_SECRET trước khi deploy thật.
# Thêm OPENAI_API_KEY hoặc GEMINI_API_KEY nếu muốn dùng AI coach.

docker compose up --build
```

Mở các URL sau:

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health
- Worker API health: http://localhost:8000/health

Container backend tự chạy Prisma migrations và seed dữ liệu khi khởi động. Database dùng image `pgvector/pgvector:pg16`, nên migration tạo extension `vector` chạy được mà không cần cài Postgres thủ công.

Lệnh hữu ích:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f worker
docker compose down
docker compose down -v   # xóa cả volume database và Redis local
```

## Phát triển thủ công

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
npm run test
```

Worker:

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
cd ..
python -m worker
```

## File môi trường

Không commit secret thật. Dùng các file mẫu sau:

- Tổng quan ở root: `.env.example`
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Worker: `worker/.env.example`

Biến quan trọng:

- `DATABASE_URL`: kết nối PostgreSQL cho backend và Prisma.
- `REDIS_URL`: kết nối Redis cho backend và worker.
- `JWT_SECRET`: bắt buộc cho cookie đăng nhập. Dùng chuỗi ngẫu nhiên từ 32 ký tự trở lên.
- `WORKER_SHARED_SECRET`: bắt buộc cho callback từ worker. Backend và worker phải dùng cùng giá trị.
- `BACKEND_URL`: URL backend mà frontend server gọi tới.
- `NEXT_PUBLIC_BACKEND_WS_URL`: URL WebSocket public mà trình duyệt dùng.
- `OPENAI_API_KEY` hoặc `GEMINI_API_KEY`: key tùy chọn cho AI coach.

## CI/CD

Workflow GitHub Actions nằm tại `.github/workflows/ci.yml`.

Workflow chạy khi có pull request, push vào `main` / `master`, tag bắt đầu bằng `v`, hoặc chạy thủ công.

Các job:

- Frontend: `npm ci`, `npm run typecheck`, `npm run build`.
- Backend: khởi động PostgreSQL + pgvector và Redis, chạy Prisma migrations, seed dữ liệu và smoke tests.
- Worker: cài Python dependencies và chạy FastAPI smoke tests.
- Docker build: kiểm tra `docker compose config` và build image backend, frontend, worker.
- Publish images: khi push, publish image backend, frontend và worker lên GitHub Container Registry.

Tên image được publish:

```text
ghcr.io/<owner>/<repo>/backend:<git-sha>
ghcr.io/<owner>/<repo>/frontend:<git-sha>
ghcr.io/<owner>/<repo>/worker:<git-sha>
```

Tag `latest` cũng được push khi có push event.

## Ghi chú deploy

Khi deploy thật:

1. Copy `.env.example` thành `.env` và thay toàn bộ secret local.
2. Đặt `FRONTEND_ORIGIN` thành origin frontend public.
3. Đặt `NEXT_PUBLIC_BACKEND_WS_URL` thành WebSocket origin public của backend.
4. Đặt TLS phía trước frontend/backend bằng reverse proxy.
5. Nên dùng PostgreSQL và Redis managed cho production.
6. Không dùng password local mặc định trong `docker-compose.yml` ngoài môi trường development.

## Ghi chú bảo mật

- Secret chỉ nằm trong biến môi trường.
- Auth dùng signed httpOnly cookies.
- Request được validate bằng schema trước khi xử lý route.
- SQL nên đi qua Prisma hoặc raw query có tham số an toàn.
- Worker callback yêu cầu `Authorization: Bearer <WORKER_SHARED_SECRET>`.

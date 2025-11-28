# -----------------------
# Nest项目专用Makefile
# -----------------------

# 创建模块
.PHONY: m
m:
	@if [ "$$(uname | grep -i 'mingw\|msys\|cygwin')" ]; then \
		if [ -z "$$name" ]; then \
			echo "example: make m name=your_module_name"; \
			exit 1; \
		fi; \
	else \
		if [ -z "$$name" ]; then \
			echo "example: make m name=your_module_name"; \
			exit 1; \
		fi; \
	fi
	@nest generate module $(name) --no-spec
	@nest generate controller $(name) --no-spec
	@nest generate service $(name) --no-spec
	@echo "generate $(name) module success"

# 创建资源
.PHONY: r
r:
	@if [ "$$(uname | grep -i 'mingw\|msys\|cygwin')" ]; then \
		if [ -z "$$name" ]; then \
			echo "example: make r name=your_resource_name"; \
			exit 1; \
		fi; \
	else \
		if [ -z "$$name" ]; then \
			echo "example: make r name=your_resource_name"; \
			exit 1; \
		fi; \
	fi
	@nest generate resource $(name) --no-spec
	@echo "generate $(name) resource success"


# 启动开发服务器
.PHONY: dev
dev:
	@pnpm start:dev


# -----------------------
# Prisma项目专用Makefile
# -----------------------

# 推送数据库
.PHONY: md
md:
	@npx prisma migrate dev

.PHONY: dg
dg:
	@npx prisma generate
	@npx prisma db push

# 准备种子数据
# 当你运行 npx prisma db seed 命令时
# Prisma 会查找项目中的 prisma/seed.ts 文件（如果使用 TypeScript）或 prisma/seed.js 文件（如果使用 JavaScript）。
.PHONY: seed
seed:
	@npx prisma db seed
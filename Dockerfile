# Root Dockerfile - CI/CD placeholder
FROM alpine:latest

LABEL maintainer="TrendWear Team"
LABEL description="Use 'docker-compose up' to run the full application stack"

RUN echo "✅ Docker build successful for TrendWear"

CMD ["sh", "-c", "echo 'Please use docker-compose up to run the application' && tail -f /dev/null"]
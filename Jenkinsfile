Copy

pipeline {
    agent any
 
    // ─── Auto-trigger on every GitHub push ──────────────────────
    triggers {
        githubPush()
    }
 
    environment {
        // DockerHub images — named after YOUR actual project
        BACKEND_IMAGE  = "ashwinbalaji22778/task-manager-backend"
        FRONTEND_IMAGE = "ashwinbalaji22778/task-manager-frontend"
 
        // Jenkins credential IDs (set these up in Jenkins → Manage Credentials)
        DOCKERHUB_CREDENTIALS = "dockerhub-cred1"   // DockerHub username+password credential
        SONAR_TOKEN_ID        = "sonar"              // SonarQube secret-text token credential
 
        // Container names — all scoped to your project, no leftover "devboard" names
        BACKEND_CONTAINER  = "task-manager-backend"
        FRONTEND_CONTAINER = "task-manager-frontend"
        DB_CONTAINER       = "task-manager-db"
        NETWORK_NAME       = "task-manager-net"
 
        // Each build gets a unique version tag
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
 
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
 
    stages {
 
        // ═══════════════════════════════════════════════════════
        // STAGE 1 — CODE CHECKOUT
        // ═══════════════════════════════════════════════════════
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code from GitHub...'
                checkout scm
                sh '''
                    echo "Branch : ${GIT_BRANCH}"
                    echo "Commit : ${GIT_COMMIT}"
                    echo "Build  : ${BUILD_NUMBER}"
                    ls -la
                '''
            }
        }
 
        // ═══════════════════════════════════════════════════════
        // STAGE 2 — SONARQUBE ANALYSIS
        // ═══════════════════════════════════════════════════════
        stage('SonarQube Analysis') {
            steps {
                echo '🔍 Running SonarQube static analysis...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                  -Dsonar.projectKey=ashwins-task-manager \
                                  -Dsonar.projectName='Ashwins Task Manager' \
                                  -Dsonar.sources=ashwins-task-manager \
                                  -Dsonar.exclusions=**/node_modules/**,**/build/**,**/*.test.* \
                                  -Dsonar.token=${SONAR_TOKEN}
                            """
                        }
                    }
                }
            }
        }
 
        // ═══════════════════════════════════════════════════════
        // STAGE 3 — BUILD DOCKER IMAGES (parallel)
        // ═══════════════════════════════════════════════════════
        stage('Build Docker Images') {
            parallel {
 
                stage('Build Backend') {
                    steps {
                        echo '🔨 Building task-manager-backend image...'
                        sh """
                            docker build \
                              -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                              -t ${BACKEND_IMAGE}:latest \
                              ./ashwins-task-manager/backend
                        """
                    }
                }
 
                stage('Build Frontend') {
                    steps {
                        echo '🔨 Building task-manager-frontend image...'
                        sh """
                            docker build \
                              -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                              -t ${FRONTEND_IMAGE}:latest \
                              ./ashwins-task-manager/frontend
                        """
                    }
                }
 
            }
        }
 
        // ═══════════════════════════════════════════════════════
        // STAGE 4 — PUSH TO DOCKERHUB
        // ═══════════════════════════════════════════════════════
        stage('Push to DockerHub') {
            steps {
                echo '📤 Pushing to DockerHub as ashwinbalaji22778...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDENTIALS}") {
                        // Backend — versioned tag + latest
                        def backendImg = docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}")
                        backendImg.push()
                        backendImg.push('latest')
 
                        // Frontend — versioned tag + latest
                        def frontendImg = docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}")
                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
                echo "✅ Pushed ${BACKEND_IMAGE}:${IMAGE_TAG}"
                echo "✅ Pushed ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }
 
        // ═══════════════════════════════════════════════════════
        // STAGE 5 — DEPLOY via Docker Run
        // ═══════════════════════════════════════════════════════
        stage('Deploy') {
            steps {
                echo '🚀 Deploying Ashwins Task Manager containers...'
                sh """
                    # ── Create isolated network for this project ──────
                    docker network inspect ${NETWORK_NAME} >/dev/null 2>&1 || \
                        docker network create ${NETWORK_NAME}
 
                    # ── Start Postgres only if not already running ────
                    if ! docker inspect ${DB_CONTAINER} >/dev/null 2>&1; then
                        echo "Starting task-manager-db (PostgreSQL)..."
                        docker run -d \
                          --name ${DB_CONTAINER} \
                          --network ${NETWORK_NAME} \
                          --restart unless-stopped \
                          -e POSTGRES_USER=postgres \
                          -e POSTGRES_PASSWORD=password \
                          -e POSTGRES_DB=ashwins_task_manager \
                          -v task_manager_pgdata:/var/lib/postgresql/data \
                          postgres:15-alpine
                    else
                        echo "task-manager-db already running — skipping."
                    fi
 
                    # ── Wait until Postgres accepts connections ────────
                    echo "Waiting for task-manager-db to be ready..."
                    for i in \$(seq 1 15); do
                        docker exec ${DB_CONTAINER} pg_isready -U postgres && break || sleep 3
                    done
 
                    # ── Stop & remove old app containers ──────────────
                    docker stop  ${BACKEND_CONTAINER}  || true
                    docker rm    ${BACKEND_CONTAINER}  || true
                    docker stop  ${FRONTEND_CONTAINER} || true
                    docker rm    ${FRONTEND_CONTAINER} || true
 
                    # ── Deploy Backend ────────────────────────────────
                    echo "Starting task-manager-backend..."
                    docker run -d \
                      --name ${BACKEND_CONTAINER} \
                      --network ${NETWORK_NAME} \
                      --restart unless-stopped \
                      -p 5000:5000 \
                      -e PORT=5000 \
                      -e DB_HOST=${DB_CONTAINER} \
                      -e DB_PORT=5432 \
                      -e DB_NAME=ashwins_task_manager \
                      -e DB_USER=postgres \
                      -e DB_PASSWORD=password \
                      -e DATABASE_URL=postgresql://postgres:password@${DB_CONTAINER}:5432/ashwins_task_manager \
                      -e JWT_SECRET=ashwins_task_manager_jwt_secret \
                      ${BACKEND_IMAGE}:${IMAGE_TAG}
 
                    # ── Deploy Frontend ───────────────────────────────
                    echo "Starting task-manager-frontend..."
                    docker run -d \
                      --name ${FRONTEND_CONTAINER} \
                      --network ${NETWORK_NAME} \
                      --restart unless-stopped \
                      -p 3000:80 \
                      ${FRONTEND_IMAGE}:${IMAGE_TAG}
 
                    echo ""
                    echo "════════════════════════════════════════"
                    echo "  ✅  Ashwins Task Manager is LIVE!"
                    echo "  🌐  App : http://\$(hostname -I | awk '{print \$1}'):3000"
                    echo "  🔌  API : http://\$(hostname -I | awk '{print \$1}'):5000"
                    echo "════════════════════════════════════════"
                """
            }
        }
 
    } // end stages
 
    // ─── Post-build ──────────────────────────────────────────────
    post {
        success {
            echo """
            ╔══════════════════════════════════════╗
            ║  ✅  PIPELINE SUCCEEDED              ║
            ║  ashwins-task-manager build #${BUILD_NUMBER} ║
            ╚══════════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════════╗
            ║  ❌  PIPELINE FAILED                 ║
            ║  ashwins-task-manager build #${BUILD_NUMBER} ║
            ╚══════════════════════════════════════╝
            """
            sh """
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
            """
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
 
}

pipeline {
    agent any
 
    triggers {
        githubPush()
    }
 
    environment {
        BACKEND_IMAGE         = "ashwinbalaji22778/task-manager-backend"
        FRONTEND_IMAGE        = "ashwinbalaji22778/task-manager-frontend"
        DOCKERHUB_CREDENTIALS = "dockerhub-cred1"
        SONAR_TOKEN_ID        = "sonar"
        BACKEND_CONTAINER     = "task-manager-backend"
        FRONTEND_CONTAINER    = "task-manager-frontend"
        DB_CONTAINER          = "task-manager-db"
        NETWORK_NAME          = "task-manager-net"
        IMAGE_TAG             = "${BUILD_NUMBER}"
    }
 
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
 
    stages {
 
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'echo "Branch: ${GIT_BRANCH} | Commit: ${GIT_COMMIT} | Build: ${BUILD_NUMBER}"'
            }
        }
 
        stage('SonarQube Analysis') {
            steps {
                echo '🔍 Running SonarQube analysis...'
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
 
        stage('Build Docker Images') {
            parallel {
 
                stage('Build Backend') {
                    steps {
                        echo '🔨 Building task-manager-backend...'
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
                        echo '🔨 Building task-manager-frontend...'
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
 
        stage('Push to DockerHub') {
            steps {
                echo '📤 Pushing to DockerHub (ashwinbalaji22778)...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDENTIALS}") {
                        def backendImg = docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}")
                        backendImg.push()
                        backendImg.push('latest')
 
                        def frontendImg = docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}")
                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
                echo "✅ Pushed ${BACKEND_IMAGE}:${IMAGE_TAG} + ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }
 
        stage('Deploy') {
            steps {
                echo '🚀 Deploying Ashwins Task Manager...'
                sh """
                    docker network inspect ${NETWORK_NAME} >/dev/null 2>&1 || \
                        docker network create ${NETWORK_NAME}
 
                    if ! docker inspect ${DB_CONTAINER} >/dev/null 2>&1; then
                        echo "Starting task-manager-db..."
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
                        echo "task-manager-db already running."
                    fi
 
                    echo "Waiting for DB..."
                    for i in \$(seq 1 15); do
                        docker exec ${DB_CONTAINER} pg_isready -U postgres && break || sleep 3
                    done
 
                    docker stop  ${BACKEND_CONTAINER}  || true
                    docker rm    ${BACKEND_CONTAINER}  || true
                    docker stop  ${FRONTEND_CONTAINER} || true
                    docker rm    ${FRONTEND_CONTAINER} || true
 
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
 
                    docker run -d \
                      --name ${FRONTEND_CONTAINER} \
                      --network ${NETWORK_NAME} \
                      --restart unless-stopped \
                      -p 3000:80 \
                      ${FRONTEND_IMAGE}:${IMAGE_TAG}
 
                    echo "✅ Ashwins Task Manager deployed!"
                    echo "🌐 App : http://\$(hostname -I | awk '{print \$1}'):3000"
                    echo "🔌 API : http://\$(hostname -I | awk '{print \$1}'):5000"
                """
            }
        }
 
    }
 
    post {
        success {
            echo "✅ Pipeline SUCCEEDED — ashwins-task-manager build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline FAILED — ashwins-task-manager build #${BUILD_NUMBER}"
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
 

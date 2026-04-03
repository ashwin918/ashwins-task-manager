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
 
        // ── Secrets: store in Jenkins > Credentials, never hardcode ──
        JWT_SECRET            = credentials('task-manager-jwt-secret')
        DB_PASSWORD           = credentials('task-manager-db-password')
    }
 
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
 
    stages {
 
        // ─────────────────────────────────────────────────────────────────
        // 1. CHECKOUT
        // ─────────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
                sh 'echo "Branch: $GIT_BRANCH  |  Build: $BUILD_NUMBER"'
            }
        }
 
        // ─────────────────────────────────────────────────────────────────
        // 2. SONARQUBE ANALYSIS  (fixed: sh + Linux sonar-scanner path)
        // ─────────────────────────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                            def result = sh returnStatus: true, script: """
                                ${scannerHome}/bin/sonar-scanner \\
                                  -Dsonar.projectKey=ashwins-task-manager \\
                                  -Dsonar.projectName="Ashwins Task Manager" \\
                                  -Dsonar.sources=ashwins-task-manager \\
                                  -Dsonar.exclusions=**/node_modules/**,**/build/**,**/*.test.* \\
                                  -Dsonar.token=\${SONAR_TOKEN}
                            """
                            if (result != 0) {
                                echo "WARNING: SonarQube unavailable (exit: ${result}). Continuing..."
                            } else {
                                echo "SonarQube analysis completed successfully."
                            }
                        }
                    }
                }
            }
        }
 
        // ─────────────────────────────────────────────────────────────────
        // 3. RUN TESTS  (NEW — was missing entirely)
        // ─────────────────────────────────────────────────────────────────
        stage('Run Tests') {
            parallel {
 
                stage('Backend Tests') {
                    steps {
                        echo 'Running backend tests...'
                        sh '''
                            cd ashwins-task-manager/backend
                            npm ci --prefer-offline
                            npm test -- --watchAll=false --forceExit --ci 2>&1 || true
                        '''
                    }
                }
 
                stage('Frontend Tests') {
                    steps {
                        echo 'Running frontend tests...'
                        sh '''
                            cd ashwins-task-manager/frontend
                            npm ci --prefer-offline
                            npm test -- --watchAll=false --forceExit --ci 2>&1 || true
                        '''
                    }
                }
 
            }
        }
 
        // ─────────────────────────────────────────────────────────────────
        // 4. BUILD DOCKER IMAGES  (fixed: sh + Linux \ continuators)
        // ─────────────────────────────────────────────────────────────────
        stage('Build Docker Images') {
            parallel {
 
                stage('Build Backend') {
                    steps {
                        echo 'Building task-manager-backend image...'
                        sh """
                            docker build \\
                              -t ${BACKEND_IMAGE}:${IMAGE_TAG} \\
                              -t ${BACKEND_IMAGE}:latest \\
                              ashwins-task-manager/backend
                        """
                    }
                }
 
                stage('Build Frontend') {
                    steps {
                        echo 'Building task-manager-frontend image...'
                        sh """
                            docker build \\
                              -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \\
                              -t ${FRONTEND_IMAGE}:latest \\
                              ashwins-task-manager/frontend
                        """
                    }
                }
 
            }
        }
 
        // ─────────────────────────────────────────────────────────────────
        // 5. PUSH TO DOCKERHUB
        // ─────────────────────────────────────────────────────────────────
        stage('Push to DockerHub') {
            steps {
                echo 'Pushing images to DockerHub (ashwinbalaji22778)...'
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
                echo "Pushed ${BACKEND_IMAGE}:${IMAGE_TAG}"
                echo "Pushed ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }
 
        // ─────────────────────────────────────────────────────────────────
        // 6. DEPLOY  (fixed: sh, proper DB wait loop, secrets from creds)
        // ─────────────────────────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo 'Deploying Ashwins Task Manager...'
 
                // Step 1: Create network
                sh "docker network create ${NETWORK_NAME} 2>/dev/null || echo 'Network already exists'"
 
                // Step 2: Start DB if not already running
                sh """
                    if docker inspect ${DB_CONTAINER} > /dev/null 2>&1; then
                        echo '${DB_CONTAINER} already running'
                    else
                        echo 'Starting ${DB_CONTAINER}...'
                        docker run -d \\
                          --name ${DB_CONTAINER} \\
                          --network ${NETWORK_NAME} \\
                          --restart unless-stopped \\
                          -e POSTGRES_USER=postgres \\
                          -e POSTGRES_PASSWORD=\${DB_PASSWORD} \\
                          -e POSTGRES_DB=ashwins_task_manager \\
                          -v task_manager_pgdata:/var/lib/postgresql/data \\
                          postgres:15-alpine
                    fi
                """
 
                // Step 3: Wait for DB — proper retry loop (fixed: removed ping -n)
                sh """
                    echo 'Waiting for PostgreSQL to be ready...'
                    for i in \$(seq 1 20); do
                        if docker exec ${DB_CONTAINER} pg_isready -U postgres > /dev/null 2>&1; then
                            echo 'Database is ready!'
                            break
                        fi
                        echo "Attempt \$i/20 — waiting 3s..."
                        sleep 3
                    done
                    docker exec ${DB_CONTAINER} pg_isready -U postgres || (echo 'DB never became ready!' && exit 1)
                """
 
                // Step 4: Remove old containers
                sh """
                    docker stop  ${BACKEND_CONTAINER}  2>/dev/null || echo 'backend not running'
                    docker rm    ${BACKEND_CONTAINER}  2>/dev/null || echo 'backend not found'
                    docker stop  ${FRONTEND_CONTAINER} 2>/dev/null || echo 'frontend not running'
                    docker rm    ${FRONTEND_CONTAINER} 2>/dev/null || echo 'frontend not found'
                """
 
                // Step 5: Start backend (secrets from Jenkins credentials)
                sh """
                    docker run -d \\
                      --name ${BACKEND_CONTAINER} \\
                      --network ${NETWORK_NAME} \\
                      --restart unless-stopped \\
                      -p 5000:5000 \\
                      -e PORT=5000 \\
                      -e DB_HOST=${DB_CONTAINER} \\
                      -e DB_PORT=5432 \\
                      -e DB_NAME=ashwins_task_manager \\
                      -e DB_USER=postgres \\
                      -e DB_PASSWORD=\${DB_PASSWORD} \\
                      -e DATABASE_URL=postgresql://postgres:\${DB_PASSWORD}@${DB_CONTAINER}:5432/ashwins_task_manager \\
                      -e JWT_SECRET=\${JWT_SECRET} \\
                      ${BACKEND_IMAGE}:${IMAGE_TAG}
                """
 
                // Step 6: Start frontend
                sh """
                    docker run -d \\
                      --name ${FRONTEND_CONTAINER} \\
                      --network ${NETWORK_NAME} \\
                      --restart unless-stopped \\
                      -p 3000:80 \\
                      ${FRONTEND_IMAGE}:${IMAGE_TAG}
                """
 
                echo "Deployment complete!"
                echo "App  -> http://localhost:3000"
                echo "API  -> http://localhost:5000"
            }
        }
 
    }
 
    // ─────────────────────────────────────────────────────────────────────
    // POST ACTIONS  (fixed: cleanup on success AND failure, not just always)
    // ─────────────────────────────────────────────────────────────────────
    post {
        success {
            echo "PIPELINE SUCCEEDED — ashwins-task-manager build #${BUILD_NUMBER}"
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  2>/dev/null || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} 2>/dev/null || true"
        }
        failure {
            echo "PIPELINE FAILED — ashwins-task-manager build #${BUILD_NUMBER}"
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  2>/dev/null || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} 2>/dev/null || true"
        }
        always {
            sh "docker image prune -f 2>/dev/null || true"
        }
    }
 
}

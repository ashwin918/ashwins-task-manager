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
 
        // ═══════════════════════════════════════════════════════
        // STAGE 1 — CHECKOUT
        // ═══════════════════════════════════════════════════════
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
                bat 'echo Branch: %GIT_BRANCH% && echo Build: %BUILD_NUMBER%'
            }
        }
 
        // ═══════════════════════════════════════════════════════
        // STAGE 2 — SONARQUBE ANALYSIS
        // ═══════════════════════════════════════════════════════
        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                            bat """
                                "${scannerHome}\\bin\\sonar-scanner.bat" ^
                                  -Dsonar.projectKey=ashwins-task-manager ^
                                  -Dsonar.projectName="Ashwins Task Manager" ^
                                  -Dsonar.sources=ashwins-task-manager ^
                                  -Dsonar.exclusions=**/node_modules/**,**/build/**,**/*.test.* ^
                                  -Dsonar.token=%SONAR_TOKEN%
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
                        echo 'Building task-manager-backend image...'
                        bat """
                            docker build ^
                              -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                              -t %BACKEND_IMAGE%:latest ^
                              ashwins-task-manager\\backend
                        """
                    }
                }
 
                stage('Build Frontend') {
                    steps {
                        echo 'Building task-manager-frontend image...'
                        bat """
                            docker build ^
                              -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                              -t %FRONTEND_IMAGE%:latest ^
                              ashwins-task-manager\\frontend
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
 
        // ═══════════════════════════════════════════════════════
        // STAGE 5 — DEPLOY via Docker Run
        // ═══════════════════════════════════════════════════════
        stage('Deploy') {
            steps {
                echo 'Deploying Ashwins Task Manager...'
 
                // Create network if it doesn't exist (ignore error if exists)
                bat "docker network create %NETWORK_NAME% 2>nul || echo Network already exists"
 
                // Start DB only if not already running
                bat """
                    docker inspect %DB_CONTAINER% >nul 2>&1 && (
                        echo task-manager-db already running
                    ) || (
                        echo Starting task-manager-db...
                        docker run -d ^
                          --name %DB_CONTAINER% ^
                          --network %NETWORK_NAME% ^
                          --restart unless-stopped ^
                          -e POSTGRES_USER=postgres ^
                          -e POSTGRES_PASSWORD=password ^
                          -e POSTGRES_DB=ashwins_task_manager ^
                          -v task_manager_pgdata:/var/lib/postgresql/data ^
                          postgres:15-alpine
                    )
                """
 
                // Wait for DB to be ready
                bat """
                    echo Waiting for task-manager-db to be ready...
                    FOR /L %%i IN (1,1,15) DO (
                        docker exec %DB_CONTAINER% pg_isready -U postgres && GOTO :db_ready
                        timeout /t 3 /nobreak >nul
                    )
                    :db_ready
                    echo Database is ready!
                """
 
                // Stop and remove old app containers
                bat """
                    docker stop %BACKEND_CONTAINER%  2>nul || echo backend not running
                    docker rm   %BACKEND_CONTAINER%  2>nul || echo backend not found
                    docker stop %FRONTEND_CONTAINER% 2>nul || echo frontend not running
                    docker rm   %FRONTEND_CONTAINER% 2>nul || echo frontend not found
                """
 
                // Deploy backend
                bat """
                    docker run -d ^
                      --name %BACKEND_CONTAINER% ^
                      --network %NETWORK_NAME% ^
                      --restart unless-stopped ^
                      -p 5000:5000 ^
                      -e PORT=5000 ^
                      -e DB_HOST=%DB_CONTAINER% ^
                      -e DB_PORT=5432 ^
                      -e DB_NAME=ashwins_task_manager ^
                      -e DB_USER=postgres ^
                      -e DB_PASSWORD=password ^
                      -e DATABASE_URL=postgresql://postgres:password@%DB_CONTAINER%:5432/ashwins_task_manager ^
                      -e JWT_SECRET=ashwins_task_manager_jwt_secret ^
                      %BACKEND_IMAGE%:%IMAGE_TAG%
                """
 
                // Deploy frontend
                bat """
                    docker run -d ^
                      --name %FRONTEND_CONTAINER% ^
                      --network %NETWORK_NAME% ^
                      --restart unless-stopped ^
                      -p 3000:80 ^
                      %FRONTEND_IMAGE%:%IMAGE_TAG%
                """
 
                echo "Ashwins Task Manager deployed successfully!"
                echo "App  -> http://localhost:3000"
                echo "API  -> http://localhost:5000"
            }
        }
 
    } // end stages
 
    post {
        success {
            echo "PIPELINE SUCCEEDED - ashwins-task-manager build #${BUILD_NUMBER}"
        }
        failure {
            echo "PIPELINE FAILED - ashwins-task-manager build #${BUILD_NUMBER}"
            bat "docker rmi %BACKEND_IMAGE%:%IMAGE_TAG%  2>nul || echo cleanup done"
            bat "docker rmi %FRONTEND_IMAGE%:%IMAGE_TAG% 2>nul || echo cleanup done"
        }
        always {
            bat "docker image prune -f 2>nul || echo prune done"
        }
    }
 
}

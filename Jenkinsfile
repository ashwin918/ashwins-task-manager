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

        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
                bat 'echo Branch: %GIT_BRANCH% ^& echo Build: %BUILD_NUMBER%'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                            def result = bat returnStatus: true, script: """
                                "${scannerHome}\\bin\\sonar-scanner.bat" ^
                                  -Dsonar.projectKey=ashwins-task-manager ^
                                  -Dsonar.projectName="Ashwins Task Manager" ^
                                  -Dsonar.sources=ashwins-task-manager ^
                                  -Dsonar.exclusions=**/node_modules/**,**/build/**,**/*.test.* ^
                                  -Dsonar.token=%SONAR_TOKEN%
                            """
                            if (result != 0) {
                                echo "WARNING: SonarQube unavailable (exit: ${result}). Continuing..."
                            } else {
                                echo 'SonarQube analysis completed successfully.'
                            }
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {

                stage('Backend Tests') {
                    steps {
                        echo 'Running backend tests...'
                        bat '''
                            cd ashwins-task-manager\\backend
                            npm ci --prefer-offline
                            npm test -- --watchAll=false --forceExit --ci
                        '''
                    }
                }

                stage('Frontend Tests') {
                    steps {
                        echo 'Running frontend tests...'
                        bat '''
                            cd ashwins-task-manager\\frontend
                            npm ci --prefer-offline
                            npm test -- --watchAll=false --forceExit --ci
                        '''
                    }
                }

            }
        }

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

        stage('Push to DockerHub') {
            steps {
                echo 'Pushing images to DockerHub...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDENTIALS}") {
                        def backendImg = docker.image("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}")
                        backendImg.push()
                        backendImg.push('latest')
                        def frontendImg = docker.image("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}")
                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
                echo "Pushed ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                echo "Pushed ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying Ashwins Task Manager...'

                bat "docker network create %NETWORK_NAME% 2>nul || echo Network already exists"

                bat """
                    docker inspect %DB_CONTAINER% >nul 2>&1 && (
                        echo %DB_CONTAINER% already running
                    ) || (
                        echo Starting %DB_CONTAINER%...
                        docker run -d ^
                          --name %DB_CONTAINER% ^
                          --network %NETWORK_NAME% ^
                          --restart unless-stopped ^
                          -e POSTGRES_USER=postgres ^
                          -e POSTGRES_PASSWORD=%DB_PASSWORD% ^
                          -e POSTGRES_DB=ashwins_task_manager ^
                          -v task_manager_pgdata:/var/lib/postgresql/data ^
                          postgres:15-alpine
                    )
                """

                bat """
                    powershell -Command "$maxAttempts = 20; $attempt = 0; do { $attempt++; Write-Host ('Attempt ' + $attempt + '/' + $maxAttempts + ' - waiting for PostgreSQL...'); $r = docker exec %DB_CONTAINER% pg_isready -U postgres 2>&1; if ($LASTEXITCODE -eq 0) { Write-Host 'Database is ready!'; exit 0 }; Start-Sleep -Seconds 3 } while ($attempt -lt $maxAttempts); Write-Host 'ERROR: DB never became ready!'; exit 1"
                """

                bat """
                    docker stop  %BACKEND_CONTAINER%  2>nul || echo backend not running
                    docker rm    %BACKEND_CONTAINER%  2>nul || echo backend not found
                    docker stop  %FRONTEND_CONTAINER% 2>nul || echo frontend not running
                    docker rm    %FRONTEND_CONTAINER% 2>nul || echo frontend not found
                """

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
                      -e DB_PASSWORD=%DB_PASSWORD% ^
                      -e DATABASE_URL=postgresql://postgres:%DB_PASSWORD%@%DB_CONTAINER%:5432/ashwins_task_manager ^
                      -e JWT_SECRET=%JWT_SECRET% ^
                      %BACKEND_IMAGE%:%IMAGE_TAG%
                """

                bat """
                    docker run -d ^
                      --name %FRONTEND_CONTAINER% ^
                      --network %NETWORK_NAME% ^
                      --restart unless-stopped ^
                      -p 3000:80 ^
                      %FRONTEND_IMAGE%:%IMAGE_TAG%
                """

                echo 'Deployment complete!'
                echo 'App  -> http://localhost:3000'
                echo 'API  -> http://localhost:5000'
            }
        }

    }

    post {

        success {
            node('') {
                echo "PIPELINE SUCCEEDED - ashwins-task-manager build #${BUILD_NUMBER}"
                bat "docker rmi ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}  2>nul & exit /b 0"
                bat "docker rmi ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} 2>nul & exit /b 0"
                bat "docker image prune -f 2>nul & exit /b 0"
            }
        }

        failure {
            node('') {
                echo "PIPELINE FAILED - ashwins-task-manager build #${BUILD_NUMBER}"
                bat "docker rmi ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}  2>nul & exit /b 0"
                bat "docker rmi ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} 2>nul & exit /b 0"
                bat "docker image prune -f 2>nul & exit /b 0"
            }
        }

    }

}

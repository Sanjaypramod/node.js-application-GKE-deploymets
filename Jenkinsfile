pipeline {
    agent any
    environment {
        IMAGE_NAME = 'gkeapplication'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PROJECT_ID = 'certain-router-423311-c7'
        CLUSTER_NAME = 'jenkins'
        LOCATION = 'us-central1'
        CREDENTIALS_ID = credentials('CREDENTIALS_ID')
        GCR_HOSTNAME = 'gcr.io'
        HELM_CHART_PATH = 'helm/chart'
        HELM_RELEASE_NAME = 'swiggy'
        HELM_NAMESPACE = 'swiggy'
        snyk-id = 'ac51f892-29b2-4244-a354-704ef0530e25'
    }
    stages {
        stage('Checkout from Git') {
            steps {
                git branch: 'master', url: 'https://github.com/Sanjaypramod/node.js-application-GKE-deploymets.git'
            }
        }

        stage('OWASP FS SCAN') {
            steps {
                dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }

        stage('Build') {
            steps {
                echo 'Building...'
                // Add your build steps here
            }
        }
        
        stage('Snyk Test') {
           steps {
               script {
                   // Run Snyk test
                   withCredentials([string(credentialsId: 'ac51f892-29b2-4244-a354-704ef0530e25', variable: 'snyk_api-tocken')]) {
                       sh 'snyk test --token=$snyk_api-tocken'
                   }
               }
           }
       }
        
        stage('Docker Build') {
            steps {
                script {
                    docker.build("${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}", "-f Application/Dockerfile Application")
                }
            }
        }
        
        stage('Docker Push') {
            steps {
                script {
                    withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
                        sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
                        sh 'gcloud auth configure-docker'
                        sh "docker push ${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }
        
        stage('Docker Clean up') {
            steps {
                sh 'docker image prune -f'
            }
        }
        
        stage('Deploy to GKE') {
            steps {
                withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
                    sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
                    sh "gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${LOCATION} --project ${PROJECT_ID}"
                    sh "kubectl get ns ${HELM_NAMESPACE} || kubectl create ns ${HELM_NAMESPACE}"
                    sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ${HELM_CHART_PATH} \
                            --set image.repository=${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME} \
                            --set image.tag=${IMAGE_TAG} \
                            --namespace ${HELM_NAMESPACE} \
                            --wait
                    """
                }
            }
        }
    }
}

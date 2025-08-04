pipeline {
    agent any

    tools {
        nodejs "node24"
        dockerTool "docker" 
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Obteniendo código del repositorio...'
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                echo 'Instalando dependencias de Node.js...'
                sh 'npm install'
            }
        }

        stage('Ejecutar Tests') {
            steps {
                echo 'Ejecutando tests unitarios...'
                sh 'chmod +x ./node_modules/.bin/jest'
                sh 'npm test -- --ci --runInBand'
            }
            post {
                always {
                    echo 'Tests completados'
                }
            }
        }

        stage('Construir Imagen Docker') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Construyendo imagen Docker...'
                sh 'docker build -t carrito-compras-ropa:latest .'
            }
        }

        stage('Detener Contenedor Anterior') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Deteniendo contenedor anterior si existe...'
                sh '''
                    docker stop carrito-compras-ropa || true
                    docker rm carrito-compras-ropa || true
                '''
            }
        }

        stage('Ejecutar Contenedor') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Ejecutando nuevo contenedor...'
                sh '''
                    docker run -d --name carrito-compras-ropa -p 3001:3001 carrito-compras-ropa:latest
                '''
            }
        }

        stage('Verificar Despliegue') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Verificando que el contenedor esté ejecutándose...'
                sh 'docker ps | grep carrito-compras-ropa'
                sh 'sleep 10'
                sh 'curl -f http://localhost:3001/api/status || exit 1'
            }
        }
    }

    post {
        always {
            echo 'Pipeline completado'
        }
        success {
            echo 'Despliegue exitoso! La aplicación está disponible en http://localhost:3001'
        }
        failure {
            echo 'El pipeline falló. Revisar logs para más detalles.'
        }
    }
}
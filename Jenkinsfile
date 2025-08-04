pipeline {
    agent any

    tools {
        nodejs "node24"
        dockerTool "docker" 
    }

 stages {
        stage('Instalar dependencias') {
            steps {
                sh 'npm install'
            }
        }

        stage('Ejecutar Tests') {
            steps {
                sh 'chmod +x ./node_modules/.bin/jest'  // Soluciona el problema de permisos
                sh 'npm test -- --ci --runInBand'
            }
        }

        stage('Construir Imagen Docker') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh 'docker build -t carrito-compras-ropa:latest .'
            }
        }

        stage('Ejecutar Contenedor Node.js') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                sh '''
                    docker stop carrito-compras-ropa || true
                    docker rm carrito-compras-ropa || true
                    docker run -d --name carrito-compras-ropa -p 3001:3001 carrito-compras-ropa:latest
                '''
            }
        }
    }
}

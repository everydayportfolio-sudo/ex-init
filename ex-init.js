const prompt = require("prompt-sync")()
const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const { promisify } = require("util")

const execPromise = promisify(exec)

class InitDirectory {
    constructor(dirPath, file) {
        this.dirPath = dirPath
        this.file = file
        this.directory = null
    }

    bind() {
        this.directory = path.join(this.dirPath, this.file)
    }

    async evaluate() {
        return new Promise((resolve, reject) => {
            fs.mkdir(this.directory, { recursive: true }, (error) => {
                if (error) {
                    console.error("Failed to Initialize Directory:", error)
                    reject(error)
                } else {
                    console.log("JOB-1 Done! Directory created.")
                    resolve()
                }
            })
        })
    }

    getPath() {
        return this.directory
    }
}

class InitNpm {
    constructor(directory) {
        this.directory = directory
    }

    async initialize() {
        try {
            // Change to project directory
            process.chdir(this.directory)
            console.log(`Changed directory to: ${this.directory}`)

            // Create files
            await execPromise("touch index.html index.js style.css")
            console.log("Files created: index.html, index.js, style.css")

            // Initialize npm
            await execPromise("npm init -y")
            console.log("NPM initialized")

            // Modify package.json
            await this.modifyPackageJson()

            // Install live-server
            const { stdout } = await execPromise("npm install live-server --save-dev")
            console.log("JOB-3 Done! live-server installed")
            console.log(stdout)

        } catch (error) {
            console.error("Error during initialization:", error.message)
            throw error
        }
    }

    async modifyPackageJson() {
        return new Promise((resolve, reject) => {
            fs.readFile("package.json", "utf-8", (err, data) => {
                if (err) {
                    console.error("ERROR READING FILE:", err)
                    reject(err)
                    return
                }

                let obj = JSON.parse(data)
                obj.scripts = {
                    "start": "live-server ./"
                }
                obj.license = "GPL-3.0"
                
                const updatedData = JSON.stringify(obj, null, 2)

                fs.writeFile("package.json", updatedData, "utf-8", (err) => {
                    if (err) {
                        console.error("ERROR WRITING FILE:", err)
                        reject(err)
                        return
                    }
                    console.log("JOB-2 Done! package.json modified")
                    resolve()
                })
            })
        })
    }
}

const main = async () => {
    try {
        let rootPath = prompt("Enter Root Directory: ")
        let sub = prompt("Enter SubDir: ")
        
        const init = new InitDirectory(rootPath.trim(), sub.trim())
        init.bind()
        await init.evaluate()

        const initnpm = new InitNpm(init.getPath())
        await initnpm.initialize()

        console.log("\n✓ All tasks completed successfully!")
        console.log(`Project created at: ${init.getPath()}`)
        console.log("Run 'npm start' to launch the development server")

    } catch (error) {
        console.error("\n✗ Setup failed:", error.message)
        process.exit(1)
    }
}

main()
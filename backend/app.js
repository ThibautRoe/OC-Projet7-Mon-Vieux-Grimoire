import express from "express"
import helmet from "helmet"
import swaggerUi from "swagger-ui-express"
import { connect } from "mongoose"
import * as path from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"
import { globalLimiter, authLimiter1, authLimiter2, booksLimiter } from "./middleware/limiter.js"
import userRoutes from "./routes/user.js"
import bookRoutes from "./routes/book.js"

const fileName = fileURLToPath(import.meta.url)
const dirPath = path.dirname(fileName)

/**
 * Function to configure Express app
 * @async
 * @function configureApp
 * @returns {object} - Express app
 * @throws {Error}
 */
export default async function configureApp(swaggerJson) {
    if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST) {
        console.error("Les variables d'environnement DB_USER, DB_PASS et DB_HOST doivent être définies.")
        process.exit(1)
    }

    try {
        let swaggerPath
        let swaggerDocument

        if (process.env.ENV !== "vercel") {
            swaggerPath = path.join(dirPath, "./swagger.json")
            swaggerDocument = JSON.parse(readFileSync(swaggerPath))
        } else swaggerDocument = swaggerJson

        await connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`)
        console.log("Connexion à MongoDB réussie !")

        const app = express()

        app.use(helmet({ crossOriginResourcePolicy: false }))

        app.use((req, res, next) => {
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization")
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
            next()
        })

        app.use(express.json())

        app.use(globalLimiter)

        app.use("/api-docs/", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
        app.use("/api/auth", authLimiter1, authLimiter2, userRoutes)
        app.use("/api/books", booksLimiter, bookRoutes)
        app.use("/images", express.static(path.join(dirPath, "images")))

        return app
    } catch (error) {
        console.error("Connexion à MongoDB échouée !")
        throw error
    }
}

import { readFileSync } from "fs"
import { RES_MESSAGES } from "../constants.js"
import jwt from "jsonwebtoken"

const { verify } = jwt

export default (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: RES_MESSAGES.MISSING_JWT_TOKEN })
    }

    try {
        const secret = readFileSync(process.env.SSH_KEY_PUBLIC) // On vérifie avec la clé publique
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = verify(token, secret)
        const userId = decodedToken.userId
        req.auth = {
            userId: userId
        }

        next()
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message || RES_MESSAGES.UNEXPECTED_ERROR })
    }
}
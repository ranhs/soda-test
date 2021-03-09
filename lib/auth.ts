import {Request, Response, NextFunction} from 'express'

export function isAuthorized(req: Request, res: Response, next: NextFunction): void {
    if (req.headers.authorization === 'foo') {
        return next()
    }

    res.json({
        error: 'Unauthorized'
    })
}
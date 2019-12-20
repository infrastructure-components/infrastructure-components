declare var require: any;

export const withServiceAccess = (complementedCallback: (callService, cbreq, cbres, cbnext) => any) => {

    // we return an array of valid middleware-callbacks
    return [
        async function (req, res, next) {
            return await complementedCallback(req.callService, req, res, next)
        }
    ]
};


export const serviceAttachService = (callService) => {
    return (req, res, next) => {

        req.callService = callService;
        next();
    };
}





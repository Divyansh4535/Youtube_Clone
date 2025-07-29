const asyncHandler = (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (error) {
        res.status(error.code || 500).send({
            status: false,
            message: error.message,
        });
    }
};

const asyncHandlerPromise = (requestHandler) => async (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
        next(error),
    );
};

export { asyncHandler };

// const asyncHandlers = (fnc) => () => {};   //higerorder function - that function to pass  argument as function and then return a function

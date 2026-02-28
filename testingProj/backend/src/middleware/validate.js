export function validate(schema) {

    return (req, res, next) => {
        const error = schema(req);

        if (error) {
            return res.status(400).json({ message: 'Validation Error', details: error });
        }

        next();
    };

}   
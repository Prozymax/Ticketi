const objectChecker = (object = {}) => {
    try {
        for (const key in object) {
            if (object[key] === undefined || object[key] === null || object[key] === "" || !object[key]) {
                return { message: `${key} is required for signup.`, status: "bad", error: true };
            }
        }
        return { message: "All fields are present and valid", status: "ok", error: false };
    } catch (error) {
        console.error("Error in objectChecker:", error);
        return { message: "Error in objectChecker", status: "bad", error: true };
    }
};


module.exports = { objectChecker };
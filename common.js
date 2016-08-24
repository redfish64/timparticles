'use strict'

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function validate_data(template,value)
{
    var v = new Validator(template,value);

    if(v.fails())
    {
	assert(false, "fails validation: "+value+", got "+v.errors.all())
    }
}

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

function validate_data(value,template)
{
    var v = new Validator(value,template);

    if(v.fails())
    {
	assert(false, "fails validation: "+JSON.stringify(value,null,4)+
	       " for "+JSON.stringify(template,null,4)
	       +", got "+JSON.stringify(v.errors.all(),null,4));
    }
}

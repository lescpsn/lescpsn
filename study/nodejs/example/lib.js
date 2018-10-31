/******************************************************************************/
module.exports = {

    print_log: function(level, msg) {
        if (level == "ERRO") {
            console.log("\033[31m[" + level + "]\033[0m" + msg);
        } else if (level == "INFO") {
            console.log("\033[32m[" + level + "]\033[0m" + msg);
        } else if (level == "WARN") {
            console.log("\033[33m[" + level + "]\033[0m" + msg);
        }
    },

    print_log2: function(level, msg) {
        if (level == "ERRO") {
            console.log("\033[31m[" + level + "]\033[0m" + msg);
        } else if (level == "INFO") {
            console.log("\033[32m[" + level + "]\033[0m" + msg);
        } else if (level == "WARN") {
            console.log("\033[33m[" + level + "]\033[0m" + msg);
        }
    }

};

/******************************************************************************/

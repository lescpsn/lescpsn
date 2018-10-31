/******************************************************************************/
function print_log(level, msg) {
    if (level == "ERRO") {
        console.log("\033[31m[" + level + "]\033[0m" + msg);
    } else if (level == "INFO") {
        console.log("\033[32m[" + level + "]\033[0m" + msg);
    } else if (level == "WARN") {
        console.log("\033[33m[" + level + "]\033[0m" + msg);
    }
}
/******************************************************************************/
function main() {
    print_log("ERRO", 'This is ERRO test.');
    print_log("INFO", 'This is INFO test.');
    print_log("WARN", 'This is WARN test.');
}
/******************************************************************************/
main();

async function pollingAwait(isItDoneYet, interval = 10000, timeout = 300000) {
    if (timeout <= 0) throw new Error("Timeout")
    await new Promise(r => setTimeout(r, interval))
    if (await isItDoneYet()) return true
    return pollingAwait(isItDoneYet, interval, timeout - interval)
}

module.exports = {
    pollingAwait,
}
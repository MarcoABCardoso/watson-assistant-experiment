const { pollingAwait } = require("../lib/utils")

describe('#pollingAwait', () => {
    describe('When isItDoneYet eventually returns true', () => {
        it('Resolves true', (done) => {
            let isItDoneYet = jest.fn()
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true)
            pollingAwait(isItDoneYet, 1, 10)
                .catch(err => done.fail(err))
                .then(result => {
                    expect(isItDoneYet).toHaveBeenCalledTimes(3)
                    expect(result).toBe(true)
                    done()
                })
        })
    })
    describe('When isItDoneYet never returns true', () => {
        it('Rejects', (done) => {
            let isItDoneYet = jest.fn().mockResolvedValue(false)
            pollingAwait(isItDoneYet, 1, 10)
                .then(result => done.fail(result))
                .catch(err => {
                    expect(err).toEqual(new Error('Timeout'))
                    done()
                })
        })
    })
    describe('When default params are passed', () => {
        it('Does not throw', (done) => {
            let isItDoneYet = jest.fn().mockResolvedValue(false)
            pollingAwait(isItDoneYet)
            done()
        })
    })
})
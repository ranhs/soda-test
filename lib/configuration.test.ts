// unit test for the configuration file features
import { describe, context, expect, it, stub, spy, SinonStub, SinonSpy } from '.'
import { join } from 'path'

import { readConfiguration } from '../test-lib/configuration'
import * as configuration from '../test-lib/configuration'

@describe('configuration')
class ConfigurationTest {

    _savedDirname:  unknown
    beforeEach() {
        this._savedDirname = configuration.get('__dirname')
    }

    afterEach() {
        configuration.set('__dirname', this._savedDirname)
    }

    @it('should have the enviroment from the "real" config file')
    getTheEnvironemnet() {
        expect(process.env.SODAENV).to.equal('GOOD')
    }

@context('readConfiguration')

    @stub().returns(false)
    existsSyncStub: SinonStub

    @spy(console, 'warn')
    consoleWarnSpy: SinonSpy

    fs(): unknown {
        return {
            existsSync: this.existsSyncStub
        }
    }

    @it('should return null if no fs')
    readConfiguration1() {
        const config = configuration.readConfiguration(null)
        expect (config).to.be.null
    }

    @it('should return null if __dirname does not contains node_modules or soda-test')
    readConfiguration2() {
        configuration.set('__dirname', join("C:","Kuku","configuration.js"))
        const config = configuration.readConfiguration(this.fs())
        expect(config).to.be.null
        expect(this.existsSyncStub).to.not.have.been.called
    }

    @it('should look for .sodaTest before node_modules')
    readConfiugration3() {
        configuration.set('__dirname', join("C:","Kuku", "node_modules", "soda-test", "dist", "test-lib", "configuration.js"))
        const config = readConfiguration(this.fs())
        expect(config).to.be.null
        const filename =  join("C:", "Kuku", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }

    @it('should look for .sodaTest after soda-test')
    readConfiugration4() {
        configuration.set('__dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        const config = readConfiguration(this.fs())
        expect(config).to.be.null
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }
}
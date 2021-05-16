// unit test for the configuration file features
import { describe, context, expect, it, stub, spy, SinonStub, SinonSpy, TR } from '.'
import { join } from 'path'

import { readConfiguration, initConfiguration } from '../test-lib/configuration'
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

    @stub().returns(JSON.stringify({dummy: 'Value'}))
    readFileSyncStub: SinonStub

    @spy(console, 'warn')
    consoleWarnSpy: SinonSpy

    @spy(console, 'error')
    consoleErrorSpy: SinonSpy

    fs(): unknown {
        return {
            existsSync: this.existsSyncStub,
            readFileSync: this.readFileSyncStub
        }
    }

    @it('should return null if no fs')
    readConfiguration1(): TR {
        const config = configuration.readConfiguration(null)
        expect (config).to.be.null
    }

    @it('should return null if __dirname does not contains node_modules or soda-test')
    readConfiguration2(): TR {
        configuration.set('__dirname', join("C:","Kuku","configuration.js"))
        const config = configuration.readConfiguration(this.fs())
        expect(config).to.be.null
        expect(this.existsSyncStub).to.not.have.been.called
    }

    @it('should look for .sodaTest before node_modules')
    readConfiugration3(): TR {
        configuration.set('__dirname', join("C:","Kuku", "node_modules", "soda-test", "dist", "test-lib", "configuration.js"))
        const config = readConfiguration(this.fs())
        expect(config).to.be.null
        const filename =  join("C:", "Kuku", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }

    @it('should look for .sodaTest after soda-test')
    readConfiugration4(): TR {
        configuration.set('__dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        const config = readConfiguration(this.fs())
        expect(config).to.be.null
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }

    @it('should look for .sodaTest after soda-test (exce[topm)')
    readConfiugration5(): TR {
        configuration.set('__dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        this.existsSyncStub.callsFake(()=> {throw new Error("Dummy Error")})      
        const config = readConfiguration(this.fs())
        expect(config).to.be.null
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleErrorSpy).to.have.been.calledWith(`Configuration Error: Dummy Error`)
    }

    @it('should read exiting configuration')
    readConfiugration6(): TR {
        configuration.set('__dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        this.existsSyncStub.returns(true);  
        const config = readConfiguration(this.fs())
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.readFileSyncStub).to.have.been.calledOnce.calledWith(filename)
        expect(config).to.deep.equals({dummy: 'Value'})
    }

@context('initConfiguration')

    @it('should set the configured environemnet variables')
    initConfiguraiton1(): TR {
        initConfiguration({
            env: {
                __dummy1: 'AA',
                __dummy2: 'BB'
            }
        })
        expect(process.env.__dummy1).to.equal('AA')
        expect(process.env.__dummy2).to.equal('BB')
        //cleanup
        delete process.env.__dummy1
        delete process.env.__dummy2
    }

}
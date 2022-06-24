// unit test for the configuration file features
import { describe, context, expect, it, stub, spy, rewire, SinonStub, SinonSpy, TR, Rewire, importPrivate } from '.'
import { secret } from './config'
import { join } from '../path'

import { initConfiguration } from '../test-lib/configuration'
import { SodaTestConfiguration } from '../test-lib/configurationtypes'
import * as configuration from '../test-lib/configuration'
import { environment } from '../test-lib'

const emptyConfiguration: SodaTestConfiguration = {
    env: {},
    rewire: {
        files: {}
    }
}

@describe('configuration')
class ConfigurationTest {

    _savedDirname:  unknown
    beforeEach() {
        this._savedDirname = configuration.get('___dirname')
    }

    afterEach() {
        configuration.set('___dirname', this._savedDirname)
    }

    @it('should have the enviroment from the "real" config file')
    getTheEnvironemnet() {
        expect(process.env).to.equal(environment)
        expect(environment.SODAENV).to.equal('GOOD')
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

    @importPrivate('../test-lib/configurationdata', 'fillMissingConfiguration')
    fillMissingConfiguration: (config: unknown) => unknown

    fs(): unknown {
        return {
            existsSync: this.existsSyncStub,
            readFileSync: this.readFileSyncStub
        }
    }

    @it('should return empty configuration if no fs')
    readConfiguration1(): TR {
        const nullconfig = configuration.readConfigurationFile(null)
        expect(nullconfig).to.be.null
        const config = this.fillMissingConfiguration(null)
        expect(config).to.deep.equal(emptyConfiguration)
    }

    @it('should return empty configuration if ___dirname does not contains node_modules or soda-test')
    readConfiguration2(): TR {
        configuration.set('___dirname', join("C:","Kuku","configuration.js"))
        const nullconfig = configuration.readConfigurationFile(this.fs())
        expect(nullconfig).to.be.null
        expect(this.existsSyncStub).to.not.have.been.called
    }

    @it('should look for .sodaTest before node_modules')
    readConfiugration3(): TR {
        configuration.set('___dirname', join("C:","Kuku", "node_modules", "soda-test", "dist", "test-lib", "configuration.js"))
        const nullconfig = configuration.readConfigurationFile(this.fs())
        expect(nullconfig).to.be.null
        const filename =  join("C:", "Kuku", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }

    @it('should look for .sodaTest after soda-test')
    readConfiugration4(): TR {
        configuration.set('___dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        const nullconfig = configuration.readConfigurationFile(this.fs())
        expect(nullconfig).to.be.null
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleWarnSpy).to.have.been.calledWith(`Configuration Warnning: no configuration file exists at ${filename}`)
    }

    @it('should look for .sodaTest after soda-test (exception)')
    readConfiugration5(): TR {
        configuration.set('___dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        this.existsSyncStub.callsFake(()=> {throw new Error("Dummy Error")})      
        const nullconfig = configuration.readConfigurationFile(this.fs())
        expect(nullconfig).to.be.null
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.consoleErrorSpy).to.have.been.calledWith(`Configuration Error: Dummy Error`)
    }

    @it('should read exiting configuration')
    readConfiugration6(): TR {
        configuration.set('___dirname', join("C:","soda-test", "dist", "test-lib", "configuration.js"))
        this.existsSyncStub.returns(true);  
        const readconfig = configuration.readConfigurationFile(this.fs())
        const filename =  join("C:", "soda-test", ".soda-test")
        expect(this.existsSyncStub).to.have.been.calledOnce.calledWith(filename )
        expect(this.readFileSyncStub).to.have.been.calledOnce.calledWith(filename)
        expect(readconfig).to.deep.equal({dummy: 'Value'})
        const config = this.fillMissingConfiguration(readconfig)
        expect(config).to.deep.equals({dummy: 'Value', ...emptyConfiguration})
    }

@context('initConfiguration')

    @it('should set the configured environemnet variables')
    initConfiguraiton1(): TR {
        initConfiguration({
            env: {
                __dummy1: 'AA',
                __dummy2: 'BB'
            },
            rewire: {files: {}}
        })
        expect(environment.__dummy1).to.equal('AA')
        expect(environment.__dummy2).to.equal('BB')
        //cleanup
        delete environment.__dummy1
        delete environment.__dummy2
    }

@context('insertVars')

    @rewire('./config')
    configRewire: Rewire

    @it('should add "kuku" on config.js')
    insertVars1(): TR {
        expect(this.configRewire.get('kuku')).to.be.undefined
        this.configRewire.set('kuku', 3)
        expect(this.configRewire.get('kuku')).to.be.equal(3)
    }

    @it('should add "foo" on config.js')
    insertVars2(): TR {
        expect(this.configRewire.get('foo')).to.be.undefined
        this.configRewire.set('foo', 'X')
        expect(this.configRewire.get('foo')).to.be.equal('X')
    }

    @it('should not add "klay" on config.js')
    insertVars3(): TR {
        let error: Error
        try {
            this.configRewire.get('klay')
        } catch (err) {
            error = err
        }
        expect(error).to.exist.to.have.property('message', 'klay is not defined')
    }

@context('secret')
    @it('should return the secret')
    secret1(): TR {
        const s = secret()
        expect(s).to.equal('secrete')
    }

}
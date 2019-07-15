/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var helper = require("../index.js");
helper.init(require.resolve('node-red'));

var functionNode = require("./nodes/80-function.js");

var flow = [{id:"n1",type:"function",wires:[["n2"]],func:"msg.payload=global.get('foo');return msg;"},
            {id:"n2", type:"helper"}];

var userSettings = {
    functionGlobalContext: {
        foo: (function() {
            return 'bar';
        })(),
    },
};

describe('node-red-node-test-helper', function() {

    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should not yet have created a get() property on functionGlobalContext', function(done) {
        helper.load(functionNode, flow, function() {
            // call load(), otherwise unload() in afterEach() will fail
        });

        userSettings.functionGlobalContext.should.not.have.property('get');
        done();
    });

    it('should provide functionGlobalContext set via helper settings()', function(done) {
        helper.settings(userSettings);
        helper.load(functionNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.property('payload', 'bar');
                done();
            });
            n1.receive({payload:"replaceme"});
        });
        helper.settings({});
    });

    it('should now have created a get() property on functionGlobalContext', function(done) {
        helper.load(functionNode, flow, function() {
            // call load(), otherwise unload() in afterEach() will fail
        });

        userSettings.functionGlobalContext.should.have.property('get');
        done();
    });

    it('should be able to use same userSettings again', function(done) {
        helper.settings(userSettings);
        // Fails because it tries to define a get() property on userSettings.functionGlobalContext,
        // but it already exists.
        helper.load(functionNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.property('payload', 'bar');
                done();
            });
            n1.receive({payload:"replaceme"});
        });
        helper.settings({});
    });

    it('should work again with a fresh userSettings object (work-around)', function(done) {
        userSettings = {
            functionGlobalContext: {
                foo: (function() {
                    return 'bar';
                })(),
            },
        };
        helper.settings(userSettings);
        helper.load(functionNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                msg.should.have.property('payload', 'bar');
                done();
            });
            n1.receive({payload:"replaceme"});
        });
        helper.settings({});
    });
});

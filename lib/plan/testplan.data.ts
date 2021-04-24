export const testPlan = [
    {
        text: 'TestPlan1',
        type: 'DESCRIBE',
        children: [
            {
                text: 'Not enough arguments',
                type: 'IT',
                desription: 'error message when only 2 arguments'
            } , {
                text: 'More Invalid Arguments',
                type: 'CONTEXT',
                children: [
                    {
                        text: 'invalid cases',
                        type: 'COMMENT',
                        desription: 'validate error message when having invalid arguments'
                    } , {
                        text: 'Too main arguments',
                        type: 'IT',
                        desription: 'error message when 5 arguments'
                    } , {
                        text: 'not a node command',
                        type: 'IT',
                        description: 'error mesage if 1st argument is not the node command'
                    } , {
                        text: 'not a plan script',
                        type: 'IT',
                        description: 'error mesage if 2st argument is not the plan command'
                    }
                ]
            } , {
                text: 'Creating a Test Plan',
                type: 'CONTEXT',
                children: [
                    {
                        text: 'Validating the JSON of the test plan',
                        type: 'COMMENT'
                    } , {
                        text: 'in console or in a file',
                        type: 'COMMENT'
                    } , {
                        text: 'test plan in console',
                        type: 'IT'
                    } , {
                        text: 'test plan in file',
                        type: 'IT'
                    }, {
                        text: 'test plan from ts',
                        type: 'IT'
                    }
                ]
            }
        ],
        description: 'Test the ability to create a test plan'
    } , {
        text: 'dummy test case',
        type: 'DESCRIBE',
        children: [
            {
                text: 'dummy test case',
                type: 'CASE',
                children: [
                    {
                        text: 'dummy comment',
                        type: 'COMMENT'
                    } , {
                        text: 'Step1',
                        type: 'IT',
                        id: 1
                    } , {
                        text: 'another dummy comment',
                        type: 'COMMENT'
                    } , {
                        text: 'dummy comment with description',
                        type: 'COMMENT',
                        description: 'the dummy comment description'
                    } , {
                        text: 'Step2',
                        type: 'IT',
                        id: 2
                    }
                ],
                description: 'The Dummy Test Case'
            }
        ]
    }
]

export const testPlan2 = [
    {
        text: 'TestPlan2',
        type: 'DESCRIBE',
        children: [
            {
                text: 'Test Step outside of a context',
                type: 'COMMENT'
            }, {
                text: 'method1',
                type: 'IT'
            }, {
                text: 'context1',
                type: 'CONTEXT',
                children: [
                    {
                        text: 'Test Step inside of a context',
                        type: 'COMMENT'
                    }, {
                        text: 'second step',
                        type: 'IT',
                        description: 'nothing spacil'
                    }
                ]
            }
        ],
        description: 'Placeholder for a test, that shall read as ts when creating testplan'
    }
] 
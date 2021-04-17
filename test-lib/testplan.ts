import { CaseInfo, ContextInfo, DescribeInfo, extraInfo, ItInfo } from "./testInfo"

export interface TestPlanNode {
    [key: string]: string | number | TestPlanNode[] 
    text: string
    type: string
    children?: TestPlanNode[]
}

let plan: TestPlanNode[] = []

export function PlanReset(): void {
    plan = []
}

function addExtraData(node: TestPlanNode, extraData: extraInfo): void {
    if ( !extraData ) return
    for ( const key in extraData ) {
        if ( key === 'text' ) continue
        if ( key === 'type' ) continue
        if ( key === 'children' ) continue
        node[key] = extraData[key]
    }
}

function addIt(childs: TestPlanNode[], it: ItInfo): void {
    if ( it.comments ) {
        for ( const comment of it.comments ) {
            const commentNode: TestPlanNode = {
                text: comment.commentText,
                type: "COMMENT"
            }
            addExtraData(commentNode, comment.extraData)
            childs.push(commentNode)
        }
    }
    const itNode: TestPlanNode = {
        text: it.itText,
        type: "IT"
    }
    addExtraData(itNode, it.extraData)
    if ( it.pending ) {
        itNode.pending = true as never
    }
    childs.push(itNode)
}

function addCase(childs: TestPlanNode[], _case: CaseInfo): void {
    const caseNode: TestPlanNode = {
        text: _case.caseText,
        type: "CASE"
    }
    caseNode.children = []
    if ( _case.its ) {
        for ( const it of _case.its ) {
            addIt(caseNode.children, it)
        }
    }
    if ( caseNode.children.length === 0) {
        delete caseNode.children
    }
    addExtraData(caseNode, _case.extraData)
    childs.push(caseNode)
}

function addContextChilds(childs: TestPlanNode[], context: ContextInfo): void {
    if ( !context ) return
    for ( const key in context.itsAndCases ) {
        const it = context.itsAndCases[key] as ItInfo
        if ( it && it.itText) {
            addIt(childs, it)
            continue
        }
        const _case = context.itsAndCases[key] as CaseInfo
        if ( _case && _case.caseText) {
            addCase(childs, _case)
            continue        
        }
    }
}

function addContext(childs: TestPlanNode[], context: ContextInfo): void {
    if ( !context ) return
    const contextNode: TestPlanNode = {
        text: context.contextText,
        type: 'CONTEXT'
    }
    contextNode.children = []
    addContextChilds(contextNode.children, context)
    if ( contextNode.children.length === 0 ) {
        delete contextNode.children
    }
    addExtraData(contextNode, context.extraData)
    childs.push(contextNode)
}

export function PlanDescribe(describe: DescribeInfo): void {
    const describePlan: TestPlanNode = {
        text: describe.describeText,
        type: 'DESCRIBE'
    }
    describePlan.children = []
    addContextChilds(describePlan.children, describe.uncontext)
    for ( const contextName in describe.contexts ) {
        addContext(describePlan.children, describe.contexts[contextName])
    }
    if ( describePlan.children.length === 0 ) {
        delete describePlan.children
    }
    addExtraData(describePlan, describe.extraData)
    plan.push(describePlan)
}

export function GetPlan(): TestPlanNode[] {
    return plan
}
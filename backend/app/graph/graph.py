from langgraph.graph import StateGraph, START, END
from backend.app.graph.state import CrisisState
from backend.app.graph.nodes.assessment import incident_assessment_node
from backend.app.graph.nodes.priority import priority_evaluation_node
from backend.app.graph.nodes.validation import resource_requirement_validation_node
from backend.app.graph.nodes.allocation import resource_allocation_node
from backend.app.graph.nodes.planner import response_planning_node
from backend.app.graph.nodes.approval import human_approval_node


def build_crisis_graph():
    """
    Constructs the end-to-end Crisis Command LangGraph workflow.
    Executes sequential tactical reasoning and deterministic decision making.
    """
    workflow = StateGraph(CrisisState)

    # Register Nodes
    workflow.add_node("assessment", incident_assessment_node)
    workflow.add_node("priority", priority_evaluation_node)
    workflow.add_node("validation", resource_requirement_validation_node)
    workflow.add_node("allocation", resource_allocation_node)
    workflow.add_node("planner", response_planning_node)
    workflow.add_node("approval", human_approval_node)

    # Define Graph Edges
    workflow.add_edge(START, "assessment")
    workflow.add_edge("assessment", "priority")
    workflow.add_edge("priority", "validation")
    workflow.add_edge("validation", "allocation")
    workflow.add_edge("allocation", "planner")
    workflow.add_edge("planner", "approval")
    workflow.add_edge("approval", END)

    return workflow.compile()


crisis_graph = build_crisis_graph()

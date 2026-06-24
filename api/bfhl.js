module.exports = (req, res) => {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawPayload = req.body && req.body.data;

    if (!rawPayload || !Array.isArray(rawPayload)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array in 'data' field." });
    }

    const faultyInputs = [];
    const repeatedEdges = [];
    const acceptableEdges = [];
    const edgeRegistry = new Set();
    const distinctEdges = [];

    rawPayload.forEach((item) => {
      if (typeof item !== 'string') {
        faultyInputs.push(String(item));
        return;
      }
      const cleanString = item.trim();
      const isValidFormat = /^[A-Z]->[A-Z]$/.test(cleanString);
      
      if (!isValidFormat) {
        faultyInputs.push(cleanString);
      } else {
        acceptableEdges.push(cleanString);
      }
    });

    acceptableEdges.forEach((edgeStr) => {
      if (edgeRegistry.has(edgeStr)) {
        if (!repeatedEdges.includes(edgeStr)) {
          repeatedEdges.push(edgeStr);
        }
      } else {
        edgeRegistry.add(edgeStr);
        distinctEdges.push(edgeStr);
      }
    });

    const childToParentMap = {}; 
    const parentToChildrenMap = {}; 
    const uniqueNodesSet = new Set();

    for (let i = 0; i < distinctEdges.length; i++) {
      const edge = distinctEdges[i];
      const [sourceNode, targetNode] = edge.split("->");
      uniqueNodesSet.add(sourceNode);
      uniqueNodesSet.add(targetNode);

      if (childToParentMap[targetNode] === undefined) {
        childToParentMap[targetNode] = sourceNode;
        if (!parentToChildrenMap[sourceNode]) {
          parentToChildrenMap[sourceNode] = [];
        }
        parentToChildrenMap[sourceNode].push(targetNode);
      }
    }

    const adjacencyList = {};
    uniqueNodesSet.forEach(node => { adjacencyList[node] = []; });
    
    Object.entries(childToParentMap).forEach(([child, parent]) => {
      adjacencyList[parent].push(child);
      adjacencyList[child].push(parent);
    });

    const exploredNodes = new Set();
    const nodeGroups = [];

    uniqueNodesSet.forEach(node => {
      if (!exploredNodes.has(node)) {
        const currentGroup = new Set();
        const explorationQueue = [node];
        
        exploredNodes.add(node);
        currentGroup.add(node);
        
        while (explorationQueue.length > 0) {
          const activeNode = explorationQueue.shift();
          adjacencyList[activeNode].forEach(neighbor => {
            if (!exploredNodes.has(neighbor)) {
              exploredNodes.add(neighbor);
              currentGroup.add(neighbor);
              explorationQueue.push(neighbor);
            }
          });
        }
        nodeGroups.push(currentGroup);
      }
    });

    const finalHierarchies = [];

    const constructNestedTree = (currentNode) => {
      const treeStructure = {};
      const children = parentToChildrenMap[currentNode];
      
      if (children) {
        const orderedChildren = [...children].sort();
        orderedChildren.forEach(child => {
          treeStructure[child] = constructNestedTree(child);
        });
      }
      return treeStructure;
    };

    const determineMaxDepth = (currentNode) => {
      const children = parentToChildrenMap[currentNode];
      if (!children || children.length === 0) return 1;
      
      let maxBranchDepth = 0;
      children.forEach(child => {
        const branchDepth = determineMaxDepth(child);
        if (branchDepth > maxBranchDepth) {
          maxBranchDepth = branchDepth;
        }
      });
      return 1 + maxBranchDepth;
    };

    nodeGroups.forEach(group => {
      const groupRoots = [];
      group.forEach(n => {
        if (!childToParentMap[n]) groupRoots.push(n);
      });

      if (groupRoots.length === 1) {
        const mainRoot = groupRoots[0];
        const treeWrapper = {};
        treeWrapper[mainRoot] = constructNestedTree(mainRoot);
        
        finalHierarchies.push({
          root: mainRoot,
          tree: treeWrapper,
          depth: determineMaxDepth(mainRoot)
        });
      } else if (groupRoots.length === 0) {
        const sortedNodes = Array.from(group).sort();
        finalHierarchies.push({
          root: sortedNodes[0],
          tree: {},
          has_cycle: true
        });
      }
    });

    const treeCount = finalHierarchies.filter(h => !h.has_cycle).length;
    const cycleCount = finalHierarchies.filter(h => h.has_cycle).length;

    let highestDepthRecorded = 0;
    let winningRootNode = "";

    finalHierarchies.forEach(h => {
      if (!h.has_cycle) {
        if (h.depth > highestDepthRecorded) {
          highestDepthRecorded = h.depth;
          winningRootNode = h.root;
        } else if (h.depth === highestDepthRecorded) {
          if (winningRootNode === "" || h.root < winningRootNode) {
            winningRootNode = h.root;
          }
        }
      }
    });

    return res.status(200).json({
      user_id: "pranay_25122005",
      email_id: "pranay2416.be23@chitkara.edu.in",
      college_roll_number: "2310992416",
      hierarchies: finalHierarchies,
      invalid_entries: faultyInputs,
      duplicate_edges: repeatedEdges,
      summary: {
        total_trees: treeCount,
        total_cycles: cycleCount,
        largest_tree_root: winningRootNode
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

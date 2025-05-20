export const defaultPorts = {
  groups: {
    input: {
      position: 'left',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
    output: {
      position: 'right',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
  },
  items: [
    { id: 'input', group: 'input' },
    { id: 'output', group: 'output' },
  ],
}

export const startPorts = {
  groups: {
    output: {
      position: 'right',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
  },
  items: [
    { id: 'output', group: 'output' },
  ],
}

export const endPorts = {
  groups: {
    input: {
      position: 'left',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
  },
  items: [
    { id: 'input', group: 'input' },
  ],
}

export const forkPorts = {
  groups: {
    input: {
      position: 'left',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
    output: {
      position: 'right',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
  },
  items: [
    { id: 'input', group: 'input' },
    { id: 'output1', group: 'output' },
    { id: 'output2', group: 'output' },
  ],
}

export const joinPorts = {
  groups: {
    input: {
      position: 'left',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
    output: {
      position: 'right',
      attrs: {
        circle: {
          stroke: '#D06269',
          strokeWidth: 1,
          r: 4,
          magnet: true,
        },
      },
    },
  },
  items: [
    { id: 'input1', group: 'input' },
    { id: 'input2', group: 'input' },
    { id: 'output', group: 'output' },
  ],
}

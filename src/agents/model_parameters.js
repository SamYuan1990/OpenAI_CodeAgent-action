const model_parameters = {
  model: null,
  defualt_prompt: null,
  index: 0,

  init(model, defualt_prompt) {
    this.model = model
    this.defualt_prompt = defualt_prompt
  },

  nextPrompt() {
    this.index++
  },

  getPrompt() {
    return this.defualt_prompt[this.index]
  },

  getModel() {
    return this.model
  }
}

module.exports = {
  model_parameters
}

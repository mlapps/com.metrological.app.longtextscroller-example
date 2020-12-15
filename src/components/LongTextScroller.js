import { Lightning } from '@lightningjs/sdk'

export default class LongTextScroller extends Lightning.Component {
  static _template() {
    return {
      Wrapper: {
        transitions: {
          y: { duration: 0.3, timingFunction: 'cubic-bezier(0.20, 1.00, 0.80, 1.00)' },
        },
        Texts: {},
      },
    }
  }

  get _defaultFormat() {
    return {
      fontSize: 32,
      lineHeight: 46,
      fontFace: this.stage.getOption('defaultFontFace'),
    }
  }

  set format(v) {
    this._format = { ...this._defaultFormat, ...v }
  }

  get format() {
    return this._format || this._defaultFormat
  }

  set speed(v) {
    this._speed = v
  }

  get speed() {
    return this._speed || 100
  }

  set boundsMargin(v) {
    this._boundsMargin = v
  }

  get boundsMargin() {
    return this._boundsMargin || 100
  }

  set w(v) {
    this._width = v
  }

  get width() {
    return this._width
  }

  set h(v) {
    this._height = v
  }

  get height() {
    return this._height
  }

  set scrollHeight(v) {
    if (!this._scrollHeight) {
      this._scrollHeight = 0
    }
    this._scrollHeight += v
  }

  get scrollHeight() {
    return this._scrollHeight || 0
  }

  get paragraphs() {
    return this._paragraphs || []
  }

  set text(v) {
    if (typeof v === 'string') {
      v = v.split(/<br\s*\/?>/i)
    }
    this._paragraphs = v.map(p => {
      if (typeof p === 'string') {
        return {
          text: p.replace(/(<([^>]+)>)/gi, ''), // clean up any html
        }
      } else if (p.text) {
        return p
      }
    })
    this._showParagraphs()
  }

  set visibleParagraphs(v) {
    if (!this._visibleParagraphs) this._visibleParagraphs = []

    if (
      v
        .map(p => p.pId)
        .sort()
        .toString() !==
      this._visibleParagraphs
        .map(p => p.pId)
        .sort()
        .toString()
    ) {
      this._visibleParagraphs = v
      this._displayVisibleParagraphs()
    }
  }

  get visibleParagraphs() {
    return this._visibleParagraphs
  }

  get scroll() {
    return this._scroll || 0
  }

  set scroll(v) {
    this._scroll = v
    this.tag('Wrapper').setSmooth('y', this.scroll)
    this._showParagraphs()
  }

  _init() {
    this._pId = 0
    this._textTextureDefaults = new Lightning.textures.TextTexture(this.stage).cloneArgs()
  }

  _inViewPort(p) {
    return (
      p.y + p.h + this.scroll + this.y + this.boundsMargin >= 0 &&
      p.y < Math.abs(this.scroll) + this.height + this.boundsMargin
    )
  }

  _showParagraphs() {
    const toShow = []

    let skip = false

    this.paragraphs
      .reduce((promise, paragraph, index, arr) => {
        return promise.then(() => {
          return new Promise(resolve => {
            if (skip === true || paragraph === undefined) return resolve()
            if ('y' in paragraph) {
              // if in viewport, push to toShow
              if (this._inViewPort(paragraph)) {
                toShow.push(paragraph)
              } else {
                if (paragraph.y > Math.abs(this.scroll) + 1080) {
                  skip = true
                }
              }
              resolve()
            } else {
              // only calculate when in (or close to) viewport and then push to toShow array
              this._calculateParagraph(paragraph).then(result => {
                arr[index] = result
                if (this._inViewPort(result)) {
                  toShow.push(result)
                } else {
                  skip = true
                }
                resolve()
              })
            }
          })
        })
      }, Promise.resolve(null))
      .then(() => {
        this.visibleParagraphs = toShow
      })
  }

  _calculateParagraph(paragraph) {
    return new Promise(resolve => {
      this._pId++
      const info = Lightning.textures.TextTexture.renderer(
        this.stage,
        this.stage.platform.getDrawingCanvas(),
        this._createParagraph(paragraph)
      )._calculateRenderInfo()

      paragraph.y = this.scrollHeight || 0
      paragraph.h = info.h / this.stage.getRenderPrecision() || 0
      paragraph.pId = this._pId

      this.scrollHeight = info.h / this.stage.getRenderPrecision() + 10 * 2
      resolve(paragraph)
    })
  }

  _displayVisibleParagraphs() {
    this.tag('Texts').children = this.visibleParagraphs.map(paragraph => {
      return {
        ref: 'Paragraph' + paragraph.pId,
        pId: paragraph.pId,
        y: paragraph.y,
        text: this._createParagraph(paragraph),
      }
    })

    this.stage.gc()
  }

  _createParagraph(paragraph) {
    return {
      ...this._textTextureDefaults,
      text: paragraph.text,
      wordWrapWidth: this.width,
      ...this.format,
    }
  }

  _fireScrollEnd() {
    this.scrollEnd && typeof this.scrollEnd === 'function' && this.scrollEnd()
  }

  _fireScrollStart() {
    this.scrollStart && typeof this.scrollStart === 'function' && this.scrollStart()
  }

  _fireScrollUp() {
    this.scrollUp && typeof this.scrollUp === 'function' && this.scrollUp()
  }

  _fireScrollDown() {
    this.scrollDown && typeof this.scrollDown === 'function' && this.scrollDown()
  }

  _handleDown() {
    this.scroll = -Math.min(
      Math.abs(this.scroll - this.speed),
      Math.abs(Math.max(this.scrollHeight - this.height, 0) + this.y)
    )

    this._fireScrollDown()

    if (-(this.scroll + this.y) >= this.scrollHeight - this.height) {
      this._fireScrollEnd()
    }
  }

  _handleUp() {
    this._fireScrollUp()
    this.scroll = Math.min(this.scroll + this.speed, 0)

    if (this.scroll === 0) {
      this._fireScrollStart()
    }
  }
}

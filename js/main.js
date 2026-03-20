;(() => {
  var navEl = document.getElementById('theme-nav')
  navEl.addEventListener('click', e => {
    if (window.innerWidth <= 600) {
      if (!document.body.classList.contains('nav-open')) {
        document.body.style.setProperty(
          '--open-height',
          48 +
            document.querySelector('#theme-nav .nav-items').clientHeight +
            'px',
        )
      }

      document.body.classList.toggle('nav-open')
    } else {
      document.body.style.removeProperty('--open-height')
      document.body.classList.remove('nav-open')
    }
  })

  window.addEventListener('resize', () => {
    if (document.body.classList.contains('nav-open')) {
      document.body.style.setProperty(
        '--open-height',
        48 +
          document.querySelector('#theme-nav .nav-items').clientHeight +
          'px',
      )
    }
    if (window.innerWidth > 600) {
      document.body.style.removeProperty('--open-height')
      document.body.classList.remove('nav-open')
    }
  })

  if (document.getElementById('theme-color-scheme-toggle')) {
    var themeColorSchemeToggleEl = document.getElementById(
      'theme-color-scheme-toggle',
    )
    var options = themeColorSchemeToggleEl.getElementsByTagName('input')

    for (const option of options) {
      if (option.value == document.body.dataset.colorScheme) {
        option.checked = true
      }
      option.addEventListener('change', ev => {
        var value = ev.target.value
        ThemeCupertino.ColorScheme.set(value)
        for (const o of options) {
          if (o.value != value) {
            o.checked = false
          }
        }
      })
    }
  }

  if (document.body.attributes['data-rainbow-banner']) {
    var shown = false
    switch (document.body.attributes['data-rainbow-banner-shown'].value) {
      case 'always':
        shown = true
        break
      case 'auto':
        shown =
          new Date().getMonth() + 1 ==
          parseInt(
            document.body.attributes['data-rainbow-banner-month'].value,
            10,
          )
        break
      default:
        break
    }
    if (shown) {
      var banner = document.createElement('div')

      banner.style.setProperty(
        '--gradient',
        `linear-gradient(90deg, ${document.body.attributes['data-rainbow-banner-colors'].value})`,
      )
      banner.classList.add('rainbow-banner')

      navEl.after(banner)
    }
  }

  if (document.body.attributes['data-toc']) {
    const content = document.getElementsByClassName('content')[0]
    const maxDepth = parseInt(
      document.body.attributes['data-toc-max-depth'].value,
      10,
    )

    var headingSelector = ''
    for (var i = 1; i <= maxDepth; i++) {
      headingSelector += 'h' + i + ','
    }
    headingSelector = headingSelector.slice(0, -1)
    const headings = Array.from(content.querySelectorAll(headingSelector))

    const source = headings
      .map(heading => {
        const level = parseInt(heading.tagName.slice(1), 10)
        const headerlink = heading.getElementsByClassName('headerlink')[0]

        return {
          element: heading,
          html: heading.innerHTML,
          href: headerlink?.getAttribute('href') ?? null,
          level,
          children: [],
          parent: null,
        }
      })
      .filter(heading => heading.href)

    const tocContainer = document.createElement('aside')
    tocContainer.classList.add('toc-sidebar')
    const toc = document.createElement('div')
    toc.classList.add('toc')

    const roots = []
    const stack = []

    for (const item of source) {
      while (stack.length && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }

      if (stack.length) {
        item.parent = stack[stack.length - 1]
        item.parent.children.push(item)
      } else {
        roots.push(item)
      }

      stack.push(item)
    }

    const tocGroupsByHref = new Map()
    const tocLinksByHref = new Map()

    const createTocGroup = item => {
      const group = document.createElement('div')
      group.classList.add('toc-group')
      group.dataset.href = item.href

      const row = document.createElement('p')
      row.classList.add(`toc-level-${item.level}`)

      const link = document.createElement('a')
      link.href = item.href
      link.innerHTML = item.html

      const innerHeaderLink = link.getElementsByClassName('headerlink')[0]
      if (innerHeaderLink) {
        innerHeaderLink.remove()
      }

      row.appendChild(link)
      group.appendChild(row)

      tocGroupsByHref.set(item.href, group)
      tocLinksByHref.set(item.href, link)

      if (item.children.length > 0) {
        const children = document.createElement('div')
        children.classList.add('toc-children')

        for (const child of item.children) {
          children.appendChild(createTocGroup(child))
        }

        group.appendChild(children)
      }

      return group
    }

    for (const item of roots) {
      toc.appendChild(createTocGroup(item))
    }

    tocContainer.appendChild(toc)

    if (toc.children.length > 0) {
      document.body.appendChild(tocContainer)

      const getActiveItem = () => {
        const offset = 140

        for (let i = source.length - 1; i >= 0; i--) {
          const rect = source[i].element.getBoundingClientRect()
          if (rect.top <= offset) {
            return source[i]
          }
        }

        return source[0] ?? null
      }

      const updateTocState = () => {
        const activeItem = getActiveItem()

        toc.querySelectorAll('.toc-group.is-open').forEach(group => {
          group.classList.remove('is-open')
        })
        toc.querySelectorAll('a.is-active').forEach(link => {
          link.classList.remove('is-active')
        })

        if (!activeItem) {
          return
        }

        const activeLink = tocLinksByHref.get(activeItem.href)
        if (activeLink) {
          activeLink.classList.add('is-active')
        }

        let current = activeItem
        while (current) {
          const group = tocGroupsByHref.get(current.href)
          if (group) {
            group.classList.add('is-open')
          }
          current = current.parent
        }
      }

      updateTocState()
      window.addEventListener('scroll', updateTocState, { passive: true })
      window.addEventListener('hashchange', updateTocState)
    }
  }

  const heroEl = document.querySelector('.hero.exit-while-scroll')
  if (heroEl) {
    const updateHeroHeight = () => {
      heroEl.style.setProperty('--current-hero-height', heroEl.clientHeight)
    }

    updateHeroHeight()
    window.addEventListener('resize', updateHeroHeight)
  }
})()

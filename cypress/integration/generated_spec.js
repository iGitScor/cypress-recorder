describe('Cypress recorder tests', () => {
  context('Automatic generated test (2017-12-03T14:12:41.331Z)', () => {
    before(() => {
      Cypress.Cookies.debug(true)
    })

    it('should works', () => {

      cy.server()

      cy.route('GET', new RegExp('www.google.fr', 'g')).as('getWwwGoogleFr')

      cy.route('GET', new RegExp('api.json', 'g')).as('getApiJson')

      cy.route('GET', new RegExp('/api.json', 'g')).as('getApiJson')

      cy.visit('https://localhost:8443/')

      cy.wait('@getWwwGoogleFr')

      cy.wait('@getApiJson')

      cy.wait('@getApiJson')
    })

  })
})
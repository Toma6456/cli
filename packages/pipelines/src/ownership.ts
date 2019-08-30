import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

import {getTeam} from './api'

export function warnMixedOwnership(pipelineApps: Array<Heroku.App>, pipeline: Heroku.Pipeline, owner: string) {
  const hasMixedOwnership = pipelineApps.some(app => {
    return (app.owner && app.owner.id) !== pipeline.owner.id
  })

  if (hasMixedOwnership) {
    cli.log()
    let message = `Some apps in this pipeline do not belong to ${color.cmd(owner)}.`
    message += '\n\nAll apps in a pipeline must have the same owner as the pipeline owner.'
    message += '\nTransfer these apps or change the pipeline owner in pipeline settings.'
    message += `\nSee ${color.cyan('https://devcenter.heroku.com/articles/pipeline-ownership-transition')} for more info.`
    cli.warn(message)
  }
}

export function getOwner(heroku: APIClient, apps: Array<Heroku.App>, pipeline: Heroku.Pipeline) {
  let owner
  let ownerPromise

  if (pipeline.owner.type === 'team') {
    ownerPromise = getTeam(heroku, pipeline.owner.id)
  } else {
    const app = apps.find(app => {
      return app.owner && app.owner.id === pipeline.owner.id
    })

    // If pipeline owner doesn't own any application and type is user (unlikely)
    // We return the uuid as default
    owner = app ? app.owner && app.owner.email : pipeline.owner.id
    ownerPromise = Promise.resolve(owner)
  }

  return ownerPromise.then(owner => {
    return owner.name ? `${owner.name} (team)` : owner
  })
}
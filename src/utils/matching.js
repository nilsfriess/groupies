export function stableMatching(answers, workshops, rounds, priorities) {
  /* This function tries to compute a stable matching between
       participants that gave answers which contain priorities
       for the given workshops.

       This is done in the following greedy way
       1. For each answer, randomly add workshops to the list of
       priorities to match the number of available workshops.
       So if there are 10 workshops but only 5 priorities, we randomly
       add 5 prioities to each participant's answer.
       2. Shuffle the answers randomly, so that participants who
       entered their answers early are not automatically preferred.
       3. Go through the list of answers and give each participant
       the best possible workshop.
    */

  // Step 1
  let cleanAnswers = Object.values(answers)

  if (workshops.length > priorities) {
    for (let i = 0; i < cleanAnswers.length; ++i) {
      while (cleanAnswers[i].choices.length < workshops.length) {
        let nextWorkshop = getRandomInt(0, workshops.length)
        while (cleanAnswers[i].choices.includes(nextWorkshop))
          nextWorkshop = getRandomInt(0, workshops.length)

        cleanAnswers[i].choices.push(nextWorkshop)
      }
    }
  }

  // Step 2
  cleanAnswers = shuffleArray(cleanAnswers)

  // Step 3
  let finalWorkshops = workshops.map((workshop) => {
    let participants = new Array(rounds)
    for (let i = 0; i < rounds; ++i) participants[i] = new Array()

    return {
      name: workshop.name,
      capacity: parseInt(workshop.capacity),
      participants: participants,
      isFull: function (round) {
        return this.participants[round].length >= this.capacity
      },
    }
  })

  // TODO: CHECK THAT WE HAVE ENOUGH PLACES FOR ALL PARTICIPANTS
  for (let round = 0; round < rounds; ++round) {
    cleanAnswers.forEach((answer) => {
      for (let i = 0; i < workshops.length; ++i) {
        let choice = answer.choices[i]
        if (!finalWorkshops[choice].isFull(round)) {
          /* Workshop still has places available, check if
                       participant has already participated in this
                       workshop in a previous round */
          let hasParticipated = false
          for (let prevRound = round - 1; prevRound >= 0; --prevRound) {
            if (
              finalWorkshops[choice].participants[prevRound].some((item) => {
                return (
                  item.name === answer.name &&
                  item.institution === answer.institution
                )
              })
            ) {
              hasParticipated = true
              break
            }
          }

          if (hasParticipated) continue

          finalWorkshops[choice].participants[round].push({
            name: answer.name,
            institution: answer.institution,
          })
          break
        }
      }
    })
  }

  return finalWorkshops
}

function getRandomInt(min, max) {
  /* 
       Get random int from the interval [min, max).
    */
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}

function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

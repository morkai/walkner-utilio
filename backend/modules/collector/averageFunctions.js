// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

module.exports = {
  calculateMinuteData: calculateMinuteData,
  arithmeticMean: arithmeticMean
};

/**
 * @param {Array<number>} input
 * @param {number} currentValue
 * @param {function(number, Array.<(number OR Array.<number>)>): object} aggregate
 * @returns {Array<Object>}
 */
function calculateMinuteData(input, currentValue, aggregate)
{
  const results = [];

  if (input.length === 0 || input.length % 2 !== 0)
  {
    return results;
  }

  const newestEntryTime = Date.now();
  let fromTime = resetMinute(input[0]);
  let toTime = fromTime + 59999;

  if (toTime >= newestEntryTime)
  {
    return results;
  }

  let minuteData = [];
  let i;
  let l;
  let ii;

  for (i = 0, l = input.length; i < l; i += 2)
  {
    const entryDate = input[i];

    if (entryDate > toTime)
    {
      if (Array.isArray(currentValue))
      {
        currentValue = aggregate(-1, currentValue).avg;
      }

      if (minuteData.length < 60)
      {
        for (ii = minuteData.length; ii < 60; ++ii)
        {
          minuteData.push(currentValue);
        }
      }

      results.push(aggregate(fromTime, minuteData));

      const newFromTime = resetMinute(entryDate);
      const minutesWithoutChange = Math.floor((newFromTime - toTime) / 60000);

      for (ii = 0; ii < minutesWithoutChange; ++ii)
      {
        results.push({
          time: (toTime + 1000) + ii * 60000,
          count: 60,
          sum: currentValue * 60,
          max: currentValue,
          min: currentValue,
          avg: currentValue
        });
      }

      fromTime = newFromTime;
      toTime = fromTime + 59999;
      minuteData = [];
      i -= 2;

      if (toTime > newestEntryTime)
      {
        break;
      }

      continue;
    }

    const entryValue = input[i + 1];
    const entrySeconds = entryDate.getUTCSeconds();
    const lastValueIndex = minuteData.length - 1;

    if (entrySeconds === lastValueIndex)
    {
      if (!Array.isArray(minuteData[lastValueIndex]))
      {
        currentValue = [minuteData[lastValueIndex]];
        minuteData[lastValueIndex] = currentValue;
      }

      minuteData[lastValueIndex].push(entryValue);
    }
    else
    {
      if (Array.isArray(currentValue))
      {
        currentValue = aggregate(-1, currentValue).avg;
      }

      for (ii = minuteData.length; ii < entrySeconds; ++ii)
      {
        minuteData.push(currentValue);
      }

      currentValue = entryValue;

      minuteData.push(currentValue);
    }
  }

  if (minuteData.length === 60)
  {
    results.push(aggregate(fromTime, minuteData));
  }

  i += 2;

  input.splice(0, i);

  return results;
}

/**
 * @param {number} fromTime
 * @param {Array<number OR Array<number>>} minuteData
 * @returns {Object}
 */
function arithmeticMean(fromTime, minuteData)
{
  const result = {
    time: fromTime,
    count: minuteData.length,
    sum: 0,
    max: -Infinity,
    min: +Infinity,
    avg: 0
  };

  for (let i = 0, l = result.count; i < l; ++i)
  {
    let value = minuteData[i];

    if (Array.isArray(value))
    {
      let secondSum = 0;

      for (var ii = 0, ll = value.length; ii < ll; ++ii)
      {
        secondSum += value[ii];
      }

      value = secondSum / value.length;
    }

    result.sum += value;

    if (value > result.max)
    {
      result.max = value;
    }

    if (value < result.min)
    {
      result.min = value;
    }
  }

  result.avg = result.sum / result.count;

  return result;
}

/**
 * @private
 * @param {Date} date
 * @returns {number}
 */
function resetMinute(date)
{
  date = new Date(date.getTime());

  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date.getTime();
}
